
/**
 * InitService.js
 *
 * @description
 * This file contains a service that can be used to start and stop other
 * services.
 *
 * @example
 *
 *   import initService from "./InitService.js";
 *
 *   initService.register(
 *   {
 *     // serviceName: "MyWebService",
 *     service: WebService,
 *     config: { port: 4000 }
 *   } );
 *
 *   initService.boot();
 */

/* ------------------------------------------------------------------ Imports */

import {
    expectString,
    expectStringOrUndefined,
    expectBoolean,
    expectObject,
    expectArray }
  from '@hkd-base/helpers/expect.js';

import {
    STOPPED,
    STARTING,
    RUNNING,
    STOPPING,
    UNAVAILABLE,
    ERROR,
    /*displayState,*/ }
  from '@hkd-base/helpers/services.js';

import ServiceBase,
       { setInitService }
  from '../classes/ServiceBase.js';

/* ---------------------------------------------------------------- Internals */

const registrations$ = Symbol('registrations');
const servicesByName$ = Symbol('servicesByName');

const targetStates$ = Symbol('targetStates');

const serviceStateUnsubscribers$ = Symbol('serviceStateUnsubscribers');

/* ------------------------------------------------------------ Service class */

class InitService extends ServiceBase
{
  constructor()
  {
    super( /* configureFn */ () =>
      {
        // this.subscribeToState( ( currentState ) =>
        //   {
        //     this.log.info( `==> Current state [${this.getState(true)}]`);
        //   } );

        // -- Set state transition handlers

        this.setTransitionHandler(
          RUNNING, this._transitionToRunning.bind(this) );

        this.setTransitionHandler(
          STOPPED, this._transitionToStopped.bind(this) );
      } );

    this[ registrations$ ] = [];
    this[ servicesByName$ ] = new Map();
    this[ targetStates$ ] = new Map();
    this[ serviceStateUnsubscribers$ ] = new Map();
  }

  // ---------------------------------------------------------------------------

  /**
   * Register a service
   *
   * @param {object} params
   *
   * @param {string} params.serviceName - Name of the service
   *
   * @param {function} params.loader
   *   Service loader (should return a service instance)
   *
   * @param {object} [params.config={}] - Service configuraiton parameters
   *
   * @param {boolean} [params.startOnBoot=true] - Start service on boot
   */
  async register( params )
  {
    expectObject( params, 'Missing or invalid parameter [params]' );

    let { serviceName,
          service,
          config={},
          startOnBoot=true,
          dependencies } = params;

    expectStringOrUndefined( serviceName, 'Invalid parameter [serviceName]' );

    if( !(service instanceof Object ) || !service.isService )
    {
      throw new Error(
        'Invalid value return by service loader [params.loader]' +
        '(expected service instance)' );
    }

    if( !serviceName )
    {
      serviceName =
        params.serviceName = service.serviceName();
    }
    else {
      service.setServiceName( serviceName );
    }

    if( this[ servicesByName$ ].has( serviceName ) )
    {
      throw new Error(`Service [${serviceName}] has already been registered`);
    }

    expectObject( config,
      'Missing or invalid parameter [config]' );

    await service.configure( config );

    expectBoolean( startOnBoot,
      'Missing or invalid parameter [startOnBoot]' );

    this[ registrations$ ].push( params );
    this[ servicesByName$ ].set( serviceName, service );

    // -- Set dependencies

    if( dependencies )
    {
      expectArray( dependencies,
        'Missing or invalid parameter [dependencies]' );

      for( const dependencyService of dependencies )
      {
        expectObject( dependencyService,
          'Invalid parameter [dependencies] ' +
          '(expected list of service instances)' );

        service.setDependency( dependencyService );
      }
    }

    //const service = this.service( serviceName );

    // -- Set current service state as target state (usually STOPPED)

    let targetState;

    switch( service.getState() )
    {
      case STOPPED:
      case STOPPING:
      case UNAVAILABLE:
      case ERROR:
        targetState = STOPPED;
        break;

      default:
        targetState = RUNNING;
    }

    this[ targetStates$ ].set( serviceName, targetState );

    // const unsubscribe =
    //   service
    //     .state
    //     .subscribe( this._serviceStateUpdated.bind( this, serviceName ) );

    // this[ serviceStateUnsubscribers$ ].set( serviceName, unsubscribe );
  }

  // ---------------------------------------------------------------------------

  /**
   * Boot
   * - Start all services marked with `startOnBoot=true`
   * - Set the target state RUNNING for all selected services
   */
  async boot()
  {
    // this.log.info("InitService: boot");

    if( !this.isConfigured() )
    {
      // auto configure
      await this.configure();
    }

    try {
      await this.setTargetState( RUNNING );
    }
    catch( e )
    {
      throw new Error( 'Initservice.boot() failed', { cause: e } );
    }
  }

  // ---------------------------------------------------------------------------

  /**
   * Shutdown
   * - Shutdown all services
   * - Set the target state STOPPED for all registered services
   */
  async shutdown()
  {
    try {
      this.log.info( 'InitService: shutdown' );

      await this.setTargetState( STOPPED );
    }
    catch( e )
    {
      console.log( 'InitService: shutdown failed', e );
    }
  }

  // ---------------------------------------------------------------------------

  /**
   * Get a registered service
   *
   * @param {string} serviceName - Name of the service
   * @param {boolean} [expectStateRunning=false]
   *
   * @returns {object} the specified service
   */
  service( serviceName, expectStateRunning=false )
  {
    expectString( serviceName,
      'Missing or invalid parameter [serviceName]' );

    const servicesByName = this[ servicesByName$ ];

    for( const [ name, service ] of servicesByName.entries() )
    {
      if( serviceName === name )
      {
        if( !expectStateRunning || service.getState() === RUNNING )
        {
          return service;
        }
        else {
          throw new Error(
            `Service [${serviceName}] is in state [${service.getState(true)}]` +
            '(expected state running)');
        }
      }
    } // end for

    throw new Error(`Service [${serviceName}] has not been registered`);
  }

  // ---------------------------------------------------------------------------

  /**
   * Start the specified service
   *
   * @param {string} serviceName - Name of the service
   */
  async startService( serviceName )
  {
    this.expectConfigured();

    expectString( serviceName,
      'Missing or invalid parameter [serviceName]' );

    const service = this.service( serviceName );

    await service.setTargetState( RUNNING );
  }

  // ---------------------------------------------------------------------------

  /**
   * Stop the specified service
   *
   * @param {string} serviceName - Name of the service
   */
  async stopService( serviceName )
  {
    this.expectConfigured();

    expectString( serviceName,
      'Missing or invalid parameter [serviceName]' );

    const service = this.service( serviceName );

    await service.setTargetState( STOPPED );
  }

  /* ------------------------------------------------------- Internal methods */

  /**
   * Transition to service state RUNNING
   *
   * @param {function} setState
   */
  async _transitionToRunning( setState )
  {
    const currentState = this.getState();

    switch( currentState )
    {
      case STARTING:
      case STOPPING:
        throw new Error(
          `Cannot transition to [RUNNING] from [${currentState.toString()}]`);
    }

    // - Set InitService state to STARTING

    setState( STARTING );

    // - Start all services that are marked with `startOnBoot=true`

    //
    // FIXME: build a dependency tree first
    //

    const registrations = this[ registrations$ ];

    for( const registration of registrations )
    {
      if( !registration.startOnBoot )
      {
        continue;
      }

      const serviceName = registration.serviceName;

      try {
        const service = this.service( serviceName );

        await service.setTargetState( RUNNING );
      }
      catch( e )
      {
        throw new Error(
          `InitService: failed to start service [${serviceName}]`,
          { cause: e } );
      }

    } // end for

    // - Set InitService state to STARTING

    // @note individual services might still be starting

    setState( RUNNING );
  }

  // ---------------------------------------------------------------------------

  /**
   * Transition to service state STOPPED
   *
   * @param {function} setState
   */
  async _transitionToStopped( setState )
  {
    // this.log.debug("****_transitionToStopped");

    // - Stop all registered services

    setState( STOPPING );

    // -- Reverse registrations

    //
    // FIXME: building a dependency tree would be better
    //
    const registrations = this[ registrations$ ];

    const reversedRegistrations = [];

    for( const registration of registrations )
    {
      reversedRegistrations.push( registration );
    }

    reversedRegistrations.reverse();

    // -- Stop services

    for( const registration of reversedRegistrations )
    {
      const serviceName = registration.serviceName;

      const service = this.service( serviceName );

      await service.setTargetState( STOPPED );
    }

    setState( STOPPED );
  }

} // end class

/* ------------------------------------------------------------------ Exports */

const service = new InitService();

setInitService( service );

export default service;
