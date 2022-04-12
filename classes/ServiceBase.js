/**
 * ServiceBase.js
 *
 * @description
 * This file contains a class that contains essential methods and code that
 * is needed by services. Service classes can extend this class to get this
 * functionality.
 *
 * @example
 *
 *   import ServiceBase from "./ServiceBase.js";
 *
 *   class MyService extends ServiceBase
 *   {
 *     ...
 *   }
 */

/* ------------------------------------------------------------------ Imports */

import {
  expectNotEmptyString,
  expectSymbolOrString,
  expectObject,
  expectFunction } from "$hk/expect.js";

import DedupValueStore from "$hk/classes/DedupValueStore.js";

import {
  STOPPED,
  STARTING,
  RUNNING,
  STOPPING,
  UNAVAILABLE,
  ERROR,
  state_label,
  displayState } from "$hk/enum/service_states.js";

const AVAILABLE = Symbol("available"); // Extra state for availability

import log, { LogBase } from "$hk/log.js";

// import { SystemLogger } from "$platform/system.js";

/* ---------------------------------------------------------------- Internals */

  const customServiceName$ = Symbol("customServiceName");

  const logContext$ = Symbol("logContext");

  const availabilityStore$ = Symbol("availabilityStore");

  const stateStore$ = Symbol("stateStore");

  const targetState$ = Symbol("targetState");

  const dependencies$ = Symbol("dependencies");

  const transitionHandlers$ = Symbol("transitionHandlers");

  const configureFn$ = Symbol("configureFn");
  const configured$ = Symbol("configured");

/* ------------------------------------------------------------------ Exports */

export default class ServiceBase extends LogBase
{
  /**
   * Constructor
   *
   * @param {function} configureFn
   *   Callback that should be called to configure the service
   */
  constructor( configureFn )
  {
    super();

    this.isService = true;

    // -- Setup this.log

    // const context =
    //   this[ logContext$ ] = { className: this.serviceName() };

    this.__logContext = { className: this.serviceName() };

    // this.log =
    //   {
    //     debug: function() {
    //       const event = log.createEvent( log.DEBUG, arguments, context );

    //       log.event( event );
    //     },

    //     info: function() {
    //       const event = log.createEvent( log.INFO, arguments, context );

    //       log.event( event );
    //     },

    //     warning: function() {
    //       const event = log.createEvent( log.WARNING, arguments, context );

    //       log.event( event );
    //     },

    //     error: function() {
    //       const event = log.createEvent( log.ERROR, arguments, context );

    //       log.event( event );
    //     }
    //   };

    // -- Object where `on stop functions` can be registered

    this.onStopFns = {};

    // -- State handling

    this[ transitionHandlers$ ] = {};

    this[ availabilityStore$ ] = new DedupValueStore( AVAILABLE );

    this[ stateStore$ ] = new DedupValueStore( STOPPED );

    this[ targetState$ ] = STOPPED;

    this[ dependencies$ ] = new Set();

    if( configureFn )
    {
      this[ configureFn$ ] = configureFn;
    }

    this[ configured$ ] = false;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Call the configure function that was supplied as constructor parameter
   * - The service should be in state STOPPED
   *
   * @param {object} config
   */
  async configure( config={} )
  {
    if( this[ configureFn$ ] )
    {
      if( this[ stateStore$ ].get() !== STOPPED )
      {
        throw new Error(
          `Cannot configure service [${this.serviceName()}]. ` +
          `Service should be in state [STOPPED]`);
      }

      await this[ configureFn$ ]( config );
    }

    this[ configured$ ] = true;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Set a custom service name
   *
   * @param {string} serviceName - Custom name for the service
   */
  setServiceName( serviceName )
  {
    expectNotEmptyString( serviceName,
      "Missing or invalid parameter [serviceName]" );

    this[ customServiceName$ ] = serviceName;
    this[ logContext$ ].className = this.serviceName();
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get the name of the service
   * - By default the service class name is returned
   * - A custom service name can be set in the property
   *   `this._customServiceName`
   */
  serviceName()
  {
    if( this[ customServiceName$ ] )
    {
      return `${this[ customServiceName$ ]}<${this.constructor.name}>`;
    }

    return this.constructor.name;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Returns true if the service has been configured at least once
   *
   * @returns {boolean} true if the service has been configured at least once
   */
  isConfigured()
  {
    return this[ configured$ ];
  }

  // -------------------------------------------------------------------- Method

  /**
   * Raises an exception if the service has not been configured yet
   */
  expectConfigured()
  {
    if( !this[ configured$ ] )
    {
      throw new Error(
        `Service [${this.serviceName()}] has not been configured yet. ` +
        `Call [${this.serviceName()}.configure(..)] first`);
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Raises an exception if the service is not in state RUNNING
   */
  expectRunning()
  {
    const currentState = this.getState();

    if( RUNNING !== currentState )
    {
      throw new Error(
        `Service [${this.serviceName()}] should be in state [RUNNING]. ` +
        `(current state [${displayState(currentState)}])`);
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Raises an exception if the service is not in the state STOPPED
   */
  expectStopped()
  {
    const currentState = this.getState();

    if( STOPPED !== currentState )
    {
      throw new Error(
        `Service [${this.serviceName()}] should be in state [STOPPED]. ` +
        `(current state [${displayState(currentState)}])`);
    }
  }

  // -------------------------------------------------------------------- Method

  setAvailable()
  {
    // this.expectConfigured();

    this[ availabilityStore$ ].set( AVAILABLE );
  }

  // -------------------------------------------------------------------- Method

  setUnavailable()
  {
    // this.expectConfigured();

    // this.log.debug("set unavailable");

    this[ availabilityStore$ ].set( UNAVAILABLE );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Set a dependency
   * - A dependency is a service (or object that has an subscribeToState method)
   * - If the state returned by the dependency is not RUNNING, this service
   *   will be set to UNAVAILABLE
   *
   * @param {object} [dependency]
   *   Service or object this service depends on
   */
  setDependency( dependency )
  {
    // this.expectConfigured();

    expectObject( dependency, "Missing or invalid parameter [dependency]" );

    expectFunction( dependency.subscribeToState,
      "Invalid parameter [dependency] (missing method [subscribeToState])" );

    const dependencyName =
      dependency.serviceName ? dependency.serviceName() : dependency.name;

    expectNotEmptyString( dependencyName,
      "Missing or invalid [dependency.serviceName()] or [dependency.name]" );

    const dependencies = this[ dependencies$ ];

    if( dependencies.has( dependency ) )
    {
      throw new Error(`Dependency [${dependencyName}] has already been set`);
    }

    dependencies.add( dependency );

    this.onStopFns[ `_unsubDep${dependencyName}` ] =
      dependency.subscribeToState( ( state ) =>
        {
          if( RUNNING === state )
          {
            let allAvailable = true;

            for( const dependency of dependencies.values() )
            {
              if( RUNNING !== dependency.getState() )
              {
                allAvailable = false;
              }
            }

            if( allAvailable )
            {
              this.setAvailable();
            }
          }
          else if( STOPPING !== state ) {
            this.setUnavailable();
          }
        },
        true /* true -> run upon registration */ );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Set the current state of the service
   *
   * @param {Symbol|string} state
   *   STOPPED|STARTING|RUNNING|STOPPING|UNAVAILABLE|ERROR or
   *   "stopped"|"starting"|"running"|"stopping"|"unavailable"|"error"
   */
  setState( state )
  {
    this.expectConfigured();

    expectSymbolOrString( state, "Missing or invalid parameter [state]" );

    state = state_label( state );

    // -- STOPPED -> Call onStopFns

    if( STOPPED === state )
    {
      for( const key in this.onStopFns )
      {
        const fn = this.onStopFns[ key ];
        fn();
      }
    }

    // -- Update state

    this[ stateStore$ ].set( state );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get the current service state
   * - The state is actually the combined result of two value stores
   *
   * @param {string} [outputAsString=false]
   *   By default a Symbol will be returned
   *
   * @returns {Symbol|string} current service state
   */
  getState( outputAsString=false )
  {
    // this.expectConfigured();

    let state = this[ stateStore$ ].get();

    if( RUNNING === state )
    {
      const availability = this[ availabilityStore$ ].get();

      // this.log.debug("getState", { state, availability } );

      if( UNAVAILABLE === availability )
      {
        state = UNAVAILABLE;
      }
    }

    if( !outputAsString )
    {
      return state;
    }

    return displayState( state );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Register a callback that will be called when the state is updated
   *
   * @param {function} callback
   *
   * @param {boolean} [callOnRegistration=true]
   *   Call the callback directly (send an initial value)
   *
   * @returns {function} unsubscribe function
   */
  subscribeToState( callback, callOnRegistration=true )
  {
    // this.expectConfigured();

    expectFunction( callback, "Missing or invalid parameter [callback]" );

    let previousState =
      callOnRegistration ? null : this[ stateStore$ ].get();

    const unsubscribeFromAvailabilityStore =
      this[ availabilityStore$ ].subscribe( ( value ) =>
        {
          // this.log.debug(
          //   "availability changed",
          //   { realState: this[ stateStore$ ].get(), value } );

          const state = this.getState();

          if( state === previousState )
          {
            return;
          }

          previousState = state;

          callback( state );
        },
        false );

    const unsubscribeFromStateStore =
      this[ stateStore$ ].subscribe( () =>
      {
        const state = this.getState();

        // this.log.debug(
        //   "state changed",
        //   { state, realState: this[ stateStore$ ].get() } );

        if( state === previousState )
        {
          return;
        }

        previousState = state;

        callback( state );
      },
      callOnRegistration );

    if( callOnRegistration === true )
    {
      const state = this.getState();

      if( state !== previousState )
      {
        callback( state );
      }
    }

    return () => {
      unsubscribeFromAvailabilityStore();
      unsubscribeFromStateStore();
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Set the target state of the service
   *
   * @param {RUNNING|STOPPED} targetState - Target state of the service
   */
  async setTargetState( targetState )
  {
    this.expectConfigured();

    switch( targetState )
    {
      case RUNNING:
      case STOPPED:
        break;
      default:
        throw new Error(
          `Invalid value for parameter [targetState] ` +
          `(expected RUNNING, STOPPED)`);
    }

    const currentState = this[ stateStore$ ].get();

    if( targetState === currentState )
    {
      // Current state is already target state -> ignore
      return;
    }

    this[ targetState$ ] = targetState;

    // Call state transition handler to initiate one or more state transitions

    this.log.info(
      `Target state changed of service [${this.serviceName()}]. ` +
      `Transition [${displayState(currentState)}] ` +
      `-> [${displayState(targetState)}]` );

    await this._transitionToState( targetState );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get the target state of the service
   *
   * @returns {RUNNING|STOPPED} targetState - Target state of the service
   */
  getTargetState()
  {
    return this[ targetState$ ];
  }

  // -------------------------------------------------------------------- Method

  /**
   * Set a handler that handles the transition to a target state
   *
   * @param {Symbol|string} targetState
   *   STOPPED|STARTING|RUNNING|STOPPING|UNAVAILABLE|ERROR or
   *   "stopped"|"starting"|"running"|"stopping"|"unavailable"|"error"
   *
   * @param {function} callback( currentState, targetState )
   *
   * @returns {function} unregister function
   */
  setTransitionHandler( targetState, callback )
  {
    expectSymbolOrString( targetState,
      "Missing or invalid parameter [targetState]" );

    expectFunction( callback, "Missing or invalid parameter [callback]" );

    targetState = state_label( targetState );

    const handlers = this[ transitionHandlers$ ];

    if( handlers[ targetState ] )
    {
      throw new Error(
        `Transition handler [${displayState(targetState)}] ` +
        `has already been registered` );
    }

    handlers[ targetState ] = callback;

    // -- Return unregister function

    return () => {
      if( handlers[ targetState ] === callback )
      {
        delete handlers[ targetState ];
      }
    };
  }

  /* ------------------------------------------------------- Internal methods */

  /**
   * Set the current state of the service
   * - setState is considered an 'internal' method of the service
   * - The method will be passed as arguments of the callback function
   *   supplied in `setTransitionHandler`.
   *
   * @param {Symbol|string} state
   *   STOPPED|STARTING|RUNNING|STOPPING|UNAVAILABLE|ERROR or
   *   "stopped"|"starting"|"running"|"stopping"|"unavailable"|"error"
   */
  _setState( state )
  {
    this.expectConfigured();

    expectSymbolOrString( state, "Missing or invalid parameter [state]" );

    state = state_label( state );

    // -- STOPPED -> Call onStopFns

    if( STOPPED === state )
    {
      for( const key in this.onStopFns )
      {
        const fn = this.onStopFns[ key ];
        fn();
      }
    }

    // -- Update state

    this[ stateStore$ ].set( state );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Transition to state
   * - Call the transition handler if defined
   * -
   * @param {string} targetState
   */
  async _transitionToState( targetState )
  {
    expectSymbolOrString( targetState,
      "Missing or invalid parameter [targetState]" );

    const currentState = this[ stateStore$ ].get();

    if( currentState === targetState )
    {
      return;
    }

    // this.log.info(`_transitionToState( ${displayState(targetState)} )` );

    const handlers = this[ transitionHandlers$ ];

    if( handlers[ targetState ] )
    {
      // await handlers[ targetState ]( currentState, this[ targetState$ ]);

      await handlers[ targetState ]( this._setState.bind( this ) );
    }
    else {
      // No handler -> automatically change the transition to the targetState
      this._setState( targetState );
    }
  }

} // end class
