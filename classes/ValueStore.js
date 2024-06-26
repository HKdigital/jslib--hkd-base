/**
 * ValueStore.js
 *
 * @description
 * This file contains a class that works like (and can be used as) a
 * SVELTE store.
 *
 * @example
 *
 *   import ValueStore from "./ValueStore.js";
 *
 *   const store = new ValueStore();
 *
 *   store.subscribe( ... );
 */

/* ------------------------------------------------------------------ Imports */

import { expectFunction }
  from '@hkd-base/helpers/expect.js';

import { defer }
  from '@hkd-base/helpers/process.js';

/* ---------------------------------------------------------------- Internals */

// @note export internal property symbols for inheritance

export const value$ = Symbol('value');
export const callbacks$ = Symbol('callbacks');
export const unsubscribers$ = Symbol('unsubscribers');

//
// async iterator support
//
//export const nextPromise$ = Symbol("nextPromise");

/* ------------------------------------------------------------------- Export */

/**
 * @callback {ValueStore~subscribeCallback}
 * @param {*} value
 * @param {function} unsubscribe
 */

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
export default class ValueStore
{
  /**
   * Constructor
   *
   * @param {*} [initialValue]
   *   Initial value to set
   *
   * @param {boolean} [enableHasSubscribers=true]
   *   If true, a property [hasSubscribers] will be set
   */
  constructor( initialValue, enableHasSubscribers=true )
  {
    this[ callbacks$ ] = new Set();
    this[ unsubscribers$ ] = new Map();

    if( undefined !== initialValue )
    {
      this.set( initialValue );
    }

    if( enableHasSubscribers )
    {
      this.hasSubscribers = new ValueStore( false, false );
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Async Iterator support
   *
   * @usage
   *
   *   const store = new ValueStore();
   *
   *   for await (const value of store)
   *   {
   *     console.log( value ); // updated when a new value is set
   *   }
   */
  /*async* [ Symbol.asyncIterator ]()
  {
    const value = this[ value$ ];

    if( value !== undefined )
    {
      yield this[ value$ ];
    }

    for( ;; )
    {
      // how does the for loop stop when the iterator is discarted?

      if( !this[ nextPromise$ ] || this[ nextPromise$ ].resolved )
      {
        this[ nextPromise$ ] = new HkPromise();
      }

      const value = await this[ nextPromise$ ];

      // console.log("iterate value", value);

      yield value;
    }

    // console.log("iteration done");

    // delete this[ nextPromise$ ]; ... nope ... maybe more iterators active
  }*/

  // -------------------------------------------------------------------- Method

  /**
   * Unsubscribe all listeners
   */
  unsubscribeAll()
  {
    for( const unsubscribe of this[ unsubscribers$ ].values() )
    {
      unsubscribe();
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Register a callback that will be called when the stored value is updated
   *
   * @param {function} callback
   *
   * @param {boolean} [callOnRegistration=true]
   *   Call the callback directly (send an initial value)
   *
   * @returns {ValueStore~subscribeCallback} unsubscribe function
   */
  subscribe( callback, callOnRegistration=true )
  {
    expectFunction( callback, 'Missing or invalid parameter [callback]' );

    if( this[ callbacks$ ].has( callback ) )
    {
      throw new Error('Callback has already been registered');
    }

    this[ callbacks$ ].add( callback );

    if( 1 === this[ callbacks$ ].size )
    {
      // First subscriber -> set hasSubscribers
      if( this.hasSubscribers )
      {
        this.hasSubscribers.set( true );
      }
    }

    // -- Define unsubscribe function

    const unsubscribe = () =>
    {
      this[ callbacks$ ].delete( callback );
      this[ unsubscribers$ ].delete( callback );

      if( 0 === this[ callbacks$ ].size )
      {
        // Last subscriber
        if( this.hasSubscribers )
        {
          this.hasSubscribers.set( false );
        }
      }
    };

    this[ unsubscribers$ ].set( callback, unsubscribe );

    // -- Call callback directly upon registration (if value was set)

    const value = this[ value$ ];

    if( undefined !== value && callOnRegistration )
    {
      callback( value, unsubscribe );
    }

    // -- Return unsubscribe function

    return unsubscribe;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Subscribe and automatically unsubscribe once the callback has been called
   *
   * @param {function} callback
   *
   * @param {boolean} [callOnRegistration=true]
   *   Call the callback directly (send an initial value)
   *
   * @returns {ValueStore~subscribeCallback} unsubscribe function
   */
  once( callback, callOnRegistration=true )
  {
    expectFunction( callback, 'Missing or invalid parameter [callback]' );

    function once( value, unsubscribe )
    {
      unsubscribe();

      callback( value, unsubscribe );
    }

    return this.subscribe( once, callOnRegistration );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Store a new value
   *
   * @param {*} [value] - Value to store
   * @param {boolean} [deferCallSubscribers=false]
   *   Set to true if call to subscribers should be defered
   *   (e.g. useful when subscribing using $ in SVELTE and setting new values
   *    in the same reactive block. SVELTE will not react on those changes
   *    otherwise)
   *
   * @returns {*} the value that was set
   */
  set( value, deferCallSubscribers=false )
  {
    // expectDefined( value, "Missing parameter [value]" );

    if( arguments.length < 1 )
    {
      throw new Error( 'Missing parameter [value]' );
    }

    // console.log( "set", value );

    this[ value$ ] = value;

    //
    // async iterator support
    //
    // if( this[ nextPromise$ ] )
    // {
    //   if( this[ nextPromise$ ].resolved )
    //   {
    //     this[ nextPromise$ ] = new HkPromise();
    //   }

    //   // console.log("resolve", value );
    //   this[ nextPromise$ ].resolve( value );
    // }

    if( !deferCallSubscribers )
    {
      this._callSubscribers();
    }
    else {
      defer( () => { this._callSubscribers(); } );
    }

    return value;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get the currently stored value
   * - Does not set property `hasSubscribers` (use `subscribe` instead if
   *   this is required)
   */
  get()
  {
    return this[ value$ ];
  }

  // -------------------------------------------------------------------- Method

  /**
   * Update the currently stored value
   *
   * @param {function} [updateFn]
   *   Function that receives the current value and returns an updated value
   *
   * @returns {*} the value that was set
   */
  update( updateFn )
  {
    expectFunction( updateFn, 'Missing or invalid parameter [updateFn]' );

    const newValue = updateFn( this[ value$ ] );

    this.set( newValue );

    return newValue;
  }

  /* ------------------------------------------------------- Internal methods */

  /**
   * Call all registered callbacks with the currently stored value as argument
   */
  _callSubscribers()
  {
    const value = this[ value$ ];

    for( const callback of this[ callbacks$ ].values() )
    {
      const unsubscribe = this[ unsubscribers$ ].get( callback );

      callback( value, unsubscribe );
    }
  }

} // end class

