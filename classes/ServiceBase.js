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
  expectFunction } from "@hkd-base/helpers/expect.js";

import DedupValueStore from "./DedupValueStore.js";

import HkPromise from "@hkd-base/classes/HkPromise.js";

import {
  STOPPED,
  // STARTING,
  RUNNING,
  // STOPPING,
  UNAVAILABLE,
  ERROR,
  stateLabel,
  displayState } from "@hkd-base/helpers/service-states.js";

import LogBase from "@hkd-base/classes/LogBase.js";

import Offs from "@hkd-base/classes/Offs.js";

import ValueStore from "@hkd-base/classes/ValueStore.js";

/* ---------------------------------------------------------------- Internals */

const WAIT_FOR_DEPENDENCIES_TIMEOUT = 30 * 1000;

const customServiceName$ = Symbol("customServiceName");

const allDependenciesAvailable$ = Symbol("availabilityStore");

const stateStore$ = Symbol("stateStore");

const targetState$ = Symbol("targetState");

const dependencies$ = Symbol("dependencies");

const transitionHandlers$ = Symbol("transitionHandlers");

const configureFn$ = Symbol("configureFn");
const configured$ = Symbol("configured");

let InitService;

/* ------------------------------------------------------------------ Exports */

/**
 * Let InitService set itself as internal variable to prevent circular
 * dependencies
 *
 * @param {object} service
 */
export function setInitService( service )
{
  InitService = service;
}

/* ------------------------------------------------------------------ Exports */

export default class ServiceBase extends LogBase
{
  /**
   * Constructor
   *
   * @param {function} configureFn
   *   Callback that should be called to configure the service
   *
   * --
   *
   * The confgureFn function is useful when using inheritance.
   *
   * In normal javascript, the super() call in a constructor must be before
   * all other code in the constructor. This means that constructore code
   * in the extended classes will be executed fist. This is not always what
   * you want.
   *
   * The configureFn function is executes bt the "ServiceBase" constructor,
   * so will be executed before all other constructor code.
   */
  constructor( configureFn )
  {
    super();

    this.isService = true;

    // -- Setup this.log

    this.__logContext = { className: this.serviceName() };

    // -- Object where `on stop functions` can be registered

    this.onStopFns = {};

    // -- State handling

    this[ transitionHandlers$ ] = {};

    this[ allDependenciesAvailable$ ] = new DedupValueStore( true );

    this[ stateStore$ ] = new DedupValueStore( STOPPED );

    this[ targetState$ ] = STOPPED;

    this[ dependencies$ ] = new Set();

    if( configureFn )
    {
      this[ configureFn$ ] = configureFn;
    }

    this[ configured$ ] = false;

    // -- Property `__offs` can be used to register unsubscribe functions

    this.__offs = new Offs();

    // -- Property `__events` can be used to send out service events

    this.__events = new ValueStore();
  }

  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------

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
    this.__logContext.className = this.serviceName();
  }

  // ---------------------------------------------------------------------------

  /**
   * Get the name of the service
   * - By default the service class name is returned
   * - A custom service name can be set in the property
   *   `this._customServiceName`
   *
   * @param {boolean} [includeOriginalServiceName=true]
   *   If a custom service name has been set, also include the original
   *   service name.
   */
  serviceName( includeOriginalServiceName=true )
  {
    if( this[ customServiceName$ ] && includeOriginalServiceName )
    {
      return `${this[ customServiceName$ ]}<${this.constructor.name}>`;
    }

    return this.constructor.name;
  }

  // ---------------------------------------------------------------------------

  /**
   * Set an event in the service's event stream
   *
   * @param {string|object} messageOrEvent
   */
  emitEvent( messageOrEvent )
  {
    let event;

    if( typeof messageOrEvent === "string" )
    {
      event = { message: messageOrEvent };
    }
    else {
      event = messageOrEvent;

      expectObject( event,
        "Missing or invalid parameter [messageOrEvent] " +
        "(expected object or string)" );
    }

    this.__events.set( event );
  }

  // ---------------------------------------------------------------------------

  /**
   * Returns true if the service has been configured at least once
   *
   * @returns {boolean} true if the service has been configured at least once
   */
  isConfigured()
  {
    return this[ configured$ ];
  }

  // ---------------------------------------------------------------------------

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

    return this;
  }

  // ---------------------------------------------------------------------------

  /**
   * Raises an exception if the service is not in state RUNNING
   */
  expectRunning()
  {
    const currentState = this.getState();

    if( RUNNING !== currentState )
    {
      throw new Error(
        `Service [${this.serviceName()}] should be in state [running]. ` +
        `(current state [${displayState(currentState)}])`);
    }

    return this;
  }

  // ---------------------------------------------------------------------------

  /**
   * Raises an exception if the service is not in the state STOPPED
   */
  expectStopped()
  {
    const currentState = this.getState();

    if( STOPPED !== currentState )
    {
      throw new Error(
        `Service [${this.serviceName()}] should be in state [stopped]. ` +
        `(current state [${displayState(currentState)}])`);
    }

    return this;
  }

  // ---------------------------------------------------------------------------

  /**
   * Raises an exception if the service is not in the state STOPPED
   */
  expectAvailable()
  {
    const currentState = this.getState();

    if( STOPPED !== currentState || !this[ allDependenciesAvailable$ ].get() )
    {
      throw new Error(
        `Service [${this.serviceName()}] and all dependencies should be in ` +
        `state [available] (current state [${displayState(currentState)}])`);
    }

    return this;
  }

  // ---------------------------------------------------------------------------

  // setDependenciesAvailable()
  // {
  //   // this.expectConfigured();

  //   this[ allDependenciesAvailable$ ].set( true );
  // }

  // ---------------------------------------------------------------------------

  // setUnavailable()
  // {
  //   // this.expectConfigured();

  //   // this.log.debug("set unavailable");

  //   this[ allDependenciesAvailable$ ].set( UNAVAILABLE );
  // }

  // ---------------------------------------------------------------------------

  /**
   * Returns true all dependencies are available
   * - A service is available if it is in state RUNNING and all dependencies
   *   are available
   */
  isAvailable()
  {
    const state = this.getState();

    if( RUNNING === state && this[ allDependenciesAvailable$ ].get() )
    {
      return true;
    }

    return false;
  }

  // ---------------------------------------------------------------------------

  /**
   * Set a dependency
   * - A dependency is a service (or object that has an subscribeToState method)
   * - If the state returned by the dependency is not RUNNING, this service
   *   will be set to UNAVAILABLE
   *
   * @param {object|string} [dependency]
   *   Service or name of the service where this service depends on
   */
  setDependency( dependency )
  {
    // this.expectConfigured();

    if( typeof dependency === "string" )
    {
      //
      // Use InitService to get the Service by name
      //
      dependency = this.getServiceByName( { name: dependency } );
    }
    else {
      expectObject( dependency, "Missing or invalid parameter [dependency]" );
    }

    expectFunction( dependency.subscribeToState,
      "Invalid parameter [dependency] (missing method [subscribeToState])" );

    const dependencyName =
      dependency.serviceName ? dependency.serviceName() : dependency.name;

    expectNotEmptyString( dependencyName,
      "Missing or invalid [dependency.serviceName()] or [dependency.name]" );

    const dependencies = this[ dependencies$ ];

    if( dependencies.has( dependency ) )
    {
      throw new Error(
        `Dependency [${dependencyName}] has already been set ` +
        `in service [${this.serviceName()}]`);
    }

    dependencies.add( dependency );

    //
    // Subscribe to dependency state changes
    // - Add unsubscribe function to `onStopFns` so it will be unsubscribed
    //   if the service stops
    //
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
                break;
              }
            } // end for

            if( allAvailable )
            {
              //
              // All dependencies are available
              //
              this[ allDependenciesAvailable$ ].set( true );
            }
            else {
              //
              // At least one dependency is not available
              //
              this[ allDependenciesAvailable$ ].set( false );
            }
          }
          else {
            //
            // Dependency is not in state RUNNING
            //

            // console.log(
            //   `Service [${this.serviceName()}]: ` +
            //   `dependency [${dependencyName}] is not available.`);

            this[ allDependenciesAvailable$ ].set( false );
          }
        },
        true /* true -> run upon registration */ );
  }

  // ---------------------------------------------------------------------------

  /**
   * Use InitService to get a dependency by name
   *
   * @param {string} _.name
   *   Name of the service as used in InitService.register()
   */
  getServiceByName( { name } )
  {
    expectNotEmptyString( name, "Missing or invalid parameter [name]" );

    if( !InitService )
    {
      throw new Error("Missing [InitService] (use [setInitService] first)");
    }

    return InitService.service( name );
  }

  // ---------------------------------------------------------------------------

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

    state = stateLabel( state );

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

  // ---------------------------------------------------------------------------

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

    if( RUNNING === state && !this[ allDependenciesAvailable$ ].get() )
    {
      state = UNAVAILABLE;
    }

    if( !outputAsString )
    {
      return state;
    }

    return displayState( state );
  }

  // ---------------------------------------------------------------------------

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

    //
    // Call the callback if the availability of dependencies changed
    //
    const unsubscribeAllDependenciesAvailable =
      this[ allDependenciesAvailable$ ].subscribe( ( allAvailable ) =>
        {
          // this.log.debug(
          //   "availability changed",
          //   { realState: this[ stateStore$ ].get(), value } );

          const state = this.getState();

          if( RUNNING === state && !allAvailable )
          {
            callback( UNAVAILABLE );
            return;
          }

          if( state === previousState )
          {
            return;
          }

          previousState = state;

          callback( state );
        },
        false );

    //
    // Call the callback if the service state changed
    //
    const unsubscribeStateStore =
      this[ stateStore$ ].subscribe( () =>
      {
        const state = this.getState();

        // this.log.debug(
        //   "state changed",
        //   { state, realState: this[ stateStore$ ].get() } );

        const allAvailable = this[ allDependenciesAvailable$ ].get();

        if( RUNNING === state && !allAvailable )
        {
          callback( UNAVAILABLE );
          return;
        }

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

      const allAvailable = this[ allDependenciesAvailable$ ].get();

      if( RUNNING === state && !allAvailable )
      {
        callback( UNAVAILABLE );
        return;
      }

      if( state !== previousState )
      {
        callback( state );
      }
    }

    return () => {
      unsubscribeAllDependenciesAvailable();
      unsubscribeStateStore();
    };
  }

  // ---------------------------------------------------------------------------

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

    // this.log.info(
    //   `Target state changed of service [${this.serviceName()}]. ` +
    //   `Transition [${displayState(currentState)}] ` +
    //   `-> [${displayState(targetState)}]` );

    await this._transitionToState( targetState );
  }

  // ---------------------------------------------------------------------------

  /**
   * Get the target state of the service
   *
   * @returns {RUNNING|STOPPED} targetState - Target state of the service
   */
  getTargetState()
  {
    return this[ targetState$ ];
  }

  // ---------------------------------------------------------------------------

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

    targetState = stateLabel( targetState );

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

    state = stateLabel( state );

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

  // ---------------------------------------------------------------------------

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

    if( RUNNING === targetState )
    {
      //
      // If a service wants to transition to state running; all dependencies
      // should be available first
      //
      // => Wait for dependencies that are not available yet
      //
      await this._waitForAllDependencies();
    }

    const handlers = this[ transitionHandlers$ ];

    if( handlers[ targetState ] )
    {
      // await handlers[ targetState ]( currentState, this[ targetState$ ]);
      try {
        await handlers[ targetState ]( this._setState.bind( this ) );
      }
      catch( e )
      {
        this._setState( ERROR );

        throw new Error(
          `Service [${this.serviceName()}] ` +
          `failed to transition to state [${displayState(targetState)}]`,
          { cause: e } );
      }
    }
    else {
      // No handler -> automatically change the transition to the targetState
      this._setState( targetState );
    }
  }

  // ---------------------------------------------------------------------------

  /**
   * Wait for all dependencies to become available
   *
   * @param {number} [timeoutMs=WAIT_FOR_DEPENDENCIES_TIMEOUT]
   *
   * @returns {Promise<boolean>} true if all dependencies are available
   */
  async _waitForAllDependencies(
    {
      timeoutMs=WAIT_FOR_DEPENDENCIES_TIMEOUT
    }={} )
  {
    this._ensureDependenciesAreNotInStateError();

    const promise = new HkPromise();

    const waitForDepsKey$ = Symbol();

    const onStopFns = this.onStopFns;

    this[ allDependenciesAvailable$ ]
      .subscribe(
        ( allAvailable, unsubscribe ) => {

          if( !onStopFns[ waitForDepsKey$ ] )
          {
            onStopFns[ waitForDepsKey$ ] = unsubscribe;
          }

          if( allAvailable )
          {
            allAvailable = true;

            onStopFns[ waitForDepsKey$ ]();
            delete onStopFns[ waitForDepsKey$ ];

            promise.resolve( true );
          }

          // const notAvailable = this._listNotAvailableDependencyNames();

          // this.log.debug(
          //   `Service [${this.serviceName()}] waiting for ` +
          //   `${notAvailable.length === 1 ? "dependency" : "dependencies"} ` +
          //   `[${notAvailable.join(",")}]` );
        } );

    if( promise.resolved )
    {
      //
      // All dependencies are already available
      // - subscribe was called upon registration
      //
      return promise;
    }

    promise.catch( () =>
      {
        const notAvailable = this._listNotAvailableDependencyNames();

        this.log.error(
          new Error(
            `Service [${this.serviceName()}] waiting for ` +
            `${notAvailable.length === 1 ? "dependency" : "dependencies"} ` +
            `[${notAvailable.join(",")}] timed out [${timeoutMs}]`) );
      } );

    promise.setTimeout( timeoutMs );

    return promise;
  }

  // ---------------------------------------------------------------------------

  /**
   * Get a list of dependency names
   *
   * @returns {string[]} list of dependency names
   */
  _listDependencyNames()
  {
    const list = [];

    const dependencies = this[ dependencies$ ].values();

    for( const dependency of dependencies )
    {
      list.push( dependency.serviceName() );
    }

    return list;
  }

  // ---------------------------------------------------------------------------

  /**
   * Get a list of not available dependencies
   *
   * @returns {string[]} list of dependency names
   */
  _listNotAvailableDependencyNames()
  {
    let notAvailable = [];

    const dependencies = this[ dependencies$ ];

    for( const dependency of dependencies.values() )
    {
      if( RUNNING !== dependency.getState() )
      {
        // Dependency is not available
        notAvailable.push( dependency.serviceName() );
      }
    } // end for

    return notAvailable;
  }

  // ---------------------------------------------------------------------------

  /**
   * Throws an exception if one of the dependencies is in state error
   */
  _ensureDependenciesAreNotInStateError()
  {
    const dependencies = this[ dependencies$ ];

    for( const dependency of dependencies.values() )
    {
      if( ERROR === dependency.getState() )
      {
        this.log.debug(`Dependency [${dependency.serviceName()}] is in state [error]`);

        throw new Error(
          `Dependency [${dependency.serviceName()}] is in state [error]`);
      }
    } // end for
  }

} // end class
