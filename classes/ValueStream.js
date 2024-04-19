/**
 * ValueStream.js
 *
 * @description
 * A stream that is updated by values when the event listeners are called.
 *
 * @note
 * A stream is like a store, but its value is only updated if there
 * is at least one subscriber
 *
 * @example
 *
 *   import ValueStream
 *     from "@hkd-base/classses/ValueStream.js";
 *
 *   const stream = new ValueStream();
 *
 *   stream.configureEventListener(
 *    {
 *      target: documentElement,
 *      eventName: "click",
 *      callbackFn: ( e ) => { return Date.now(); }
 *    } )
 *
 *   stream.subscribe( ( timestamp ) =>
 *     {
 *       console.log( { timestamp } );
 *     } );
 */

/* ------------------------------------------------------------------ Imports */

import { expectString,
         expectObject,
         expectFunction } from '@hkd-base/helpers/expect.js';

import ValueStore from '@hkd-base/classes/ValueStore.js';

/* ---------------------------------------------------------------- Internals */

/* ------------------------------------------------------------------- Export */

/**
 * ValueStore
 * - Class that can be used to store a value and subscribe to value changes
 *
 * - This class exposes a property [hasSubscribers], which is a ValueStore,
 *   that contains the value true or false. This property can be used to
 *   let code react if the first subscriber registered or the last subscriber
 *   unregistered.
 *
 */
export default class ValueStream extends ValueStore
{
  /**
   * Constructor
   *
   * @param {mixed} [initialValue]
   *   Initial value to set
   *
   * @param {boolean} [enableHasSubscribers=true]
   *   If true, a property [hasSubscribers] will be set
   */
  constructor( initialValue )
  {
    super( initialValue, /* enableHasSubscribers */ true );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Configure an event listener that triggers stream updates
   * - The event listener is registered on demand
   * - The event listener can/should do an operation on the stream
   * - The return value of the event listener is returned to the function that
   *   triggered the event.
   *
   * --
   *
   * @param {object} _.target
   *   Object from where the event will be dispatched
   *
   * @param {string} _.eventName
   *   Name of the event to subscribe to
   *
   * @param {function} [_.callbackFn]
   *   A callback function that receives parameter: { e, { target, stream } }
   *   and is expected to do an operation on the stream, e.g. stream.set();
   *
   *   The value returned by the callback is returned as event handler return
   *   value (e.g. `false` to cancel a default operation)
   *
   * @param {function} [_.registerFunctionName="addEventListener"]
   * @param {function} [_.unregisterFunctionName="removeEventListener"]
   *
   * @returns {function} unsubscribe function
   */
  configureEventListener(
    {
      target,
      eventName,
      callbackFn,
      registerFunctionName = 'addEventListener',
      unregisterFunctionName = 'removeEventListener'
    } )
  {
    expectObject( target,
      'Missing or invalid parameter [target]' );

    expectString( eventName,
      'Missing or invalid parameter [eventName]' );

    expectFunction( callbackFn,
      'Missing or invalid parameter [callbackFn]' );

    expectString( registerFunctionName,
      'Invalid parameter [registerFunctionName]' );

    if( typeof target[ registerFunctionName ] !== 'function' )
    {
      throw new Error(
        `Invalid registerFunctionName [${registerFunctionName}]`);
    }

    expectString( unregisterFunctionName, 'Invalid parameter [unregisterFn]' );

    if( typeof target[ unregisterFunctionName ] !== 'function' )
    {
      throw new Error(
        `Invalid unregisterFunctionName [${unregisterFunctionName}]`);
    }

    // == Register and unregister functions

    const registerFn = () =>
      {
        if( callbackFn )
        {
          target[ registerFunctionName ]( eventName,
            /* eventHandlerFn */ ( e ) =>
            {
              return callbackFn( e, { target, stream: this } );
            } );
        }
        else {
          target[ registerFunctionName ]( eventName, ( e ) =>
            {
              this.set( e );
            } );
        }
      };

    const unregisterFn = () =>
      {
        target[ unregisterFunctionName ]( eventName, callbackFn );
      };

    // == Only subscribe to event listener is there are subscribers

    const hasSubscribersOff =
      this.hasSubscribers.subscribe( ( hasSubscribers ) =>
        {
          if( hasSubscribers )
          {
            registerFn();
          }
          else {
            unregisterFn();
          }
        } );

    // == Return unsubscribe function

    return () => {
      hasSubscribersOff();
      unregisterFn();
    };
  }

  // -------------------------------------------------------------------- Method

  /**
   * Configure a store subscriber that triggers stream updates
   * - The store listener is subscribed on demand
   * - The store listener can/should do updates on the stream
   * - If a value is returned, it will trigger an exception to prevent
   *   programming errors
   *
   * @param {object} store
   * @param {function} [callbackFn]
   */
  configureStoreSubscriber(
    {
      store,
      callbackFn
    } )
  {
    expectObject( store,
      'Missing or invalid parameter [store]' );

    if( callbackFn )
    {
      expectFunction( callbackFn,
        'Missing or invalid parameter [callbackFn]' );
    }

    let unsubscibeFn;

    const registerFn = () =>
      {
        if( callbackFn )
        {
          unsubscibeFn = store.subscribe( ( value ) =>
            {
              const unexpectedValue =
                callbackFn( value, { store, stream: this } );

              if( undefined !== unexpectedValue )
              {
                throw new Error(
                  'A store subscriber should not return any value');
              }

            }  );
        }
        else {
          unsubscibeFn = store.subscribe( ( value ) => { this.set( value ); } );
        }
      };

    const unregisterFn = () =>
      {
        if( unsubscibeFn )
        {
          unsubscibeFn();
          unsubscibeFn = null;
        }
      };

    // == Only subscribe to event listener is there are subscribers

    const hasSubscribersOff =
      this.hasSubscribers.subscribe( ( hasSubscribers ) =>
        {
          if( hasSubscribers )
          {
            registerFn();
          }
          else {
            unregisterFn();
          }
        } );

    // == Return unsubscribe function

    return () => {
      hasSubscribersOff();
      unregisterFn();
    };
  }

  /* ------------------------------------------------------- Internal methods */

} // end class

