/**
 * ValueStoreMap.js
 *
 * @description
 * This file contains a class that manages key-value pairs, where the values
 * are (SVELTE-like) stores.
 *
 * @example
 *
 *   import ValueStoreMap from "./ValueStoreMap.js";
 *
 *   const person =
 *     new ValueStoreMap( { hairColor: "brown", age: 44 } );
 *
 *   console.log( store.get( "hairColor" ) ); // "brown"
 */

/* ------------------------------------------------------------------ Imports */

import { expectFunction, expectDefined } from "../expect.js";

import ValueStore from "./ValueStore.js";

/* ---------------------------------------------------------------- Internals */

/* ------------------------------------------------------------------- Export */

/**
 * ValueStoreMap
 * - Class that can be used to store a key-value pairs and subscribe
 *   to value changes
 *
 * - This class exposes a property [hasSubscribers], which is a ValueStore,
 *   that contains the value true or false. This property can be used to
 *   let code react if the first subscriber registered or the last subscriber
 *   unregistered.
 */
export default class ValueStoreMap extends Map
{
  /**
   * Constructor
   *
   * @param {object} [initialKeyValuePairs]
   *   Object that contains the initial key-value pairs to set
   */
  constructor( initialKeyValuePairs )
  {
    super();

    if( undefined !== initialKeyValuePairs )
    {
      this.setObject( initialKeyValuePairs );
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Unsubscribe all listeners from all stores in the map
   */
  unsubscribeAll()
  {
    for( const store of this.values() )
    {
      store.unsubscribeAll();
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Register a callback that will be called when the specified key-value pair
   * is updated
   *
   * @param {function} callback
   *
   * @returns {function} unsubscribe function
   */
  subscribe( key, callback, callOnRegistration=true )
  {
    expectDefined( key, "Missing or invalid parameter [key]" );
    expectFunction( callback, "Missing or invalid parameter [callback]" );

    const store = super.get( key );

    if( store instanceof Object )
    {
      return store.subscribe( callback, callOnRegistration );
    }

    // -- Create new store

    const newStore = new ValueStorage();

    super.set( key, newStore );

    // -- Return unsubscribe function

    return newStore.subscribe( callback, false ); // callOnRegistration=false
  }

  // -------------------------------------------------------------------- Method

  /**
   * Store a new value
   *
   * @param {*} [key] - Key part of the key-value pair
   *
   * @param {*} [value]
   *   Value to store. If undefined, a store is created, but no value is set
   */
  set( key, value )
  {
    expectDefined( key, "Missing parameter [key]" );
    // expectDefined( value, "Missing parameter [value]" );

    if( arguments.length < 2 )
    {
      throw new Error( "Missing parameter [value]" );
    }

    if( value instanceof ValueStore )
    {
      throw new Error("Invalid parameter [value] (should not be a store)");
    }

    const store = super.get( key );

    if( store instanceof Object )
    {
      // console.log("set: existing store:", { key, value } );

      store.set( value );
      return;
    }

    // -- Create new store and set value

    // console.log("set: Automatically create store", { key, value } );

    const newStore = new ValueStore( value );

    super.set( key, newStore );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Clear all existing key-value pairs and optionally set key-value pairs
   * from the supplied object
   *
   * @param {object} item - Object that contains key-value pair to set
   */
  setObject( item )
  {
    expectDefined( item, "Missing parameter [item]" );

    for( const key in item )
    {
      const value = item[ key ];

      this.set( key, value );
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Delete a value store from the map
   * - Unsubscribes all listeners from the specified store
   *
   * @param {*} [key] - Key part of the key-value pair
   */
  delete( key )
  {
    expectDefined( key, "Missing or invalid parameter [key]" );

    const store = super.get( key );

    if( store )
    {
      store.unsubscribeAll();

      this.delete( key );
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Returns true if the specified key exists
   *
   * @param {string} key
   *
   * @returns {boolean} true if the key exists
   */
  has( key )
  {
    expectDefined( key, "Missing or invalid parameter [key]" );

    return super.has( key );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get the currently stored value
   * - Creates a new Value storage if it does not exist
   *
   * @param {string} [key] - Key part of the key-value pair
   *
   * @param {mixed} [defaultValue=undefined]
   *   Default value to set if a storage is created
   *
   * @returns {*} Value that was stored for the specified key or undefined
   */
  get( key, defaultValue=undefined )
  {
    expectDefined( key, "Missing or invalid parameter [key]" );

    let store = super.get( key );

    if( store instanceof Object )
    {
      return store.get();
    }

    // -- Automatically create a store

    store = new ValueStore( defaultValue );

    super.set( key, store );

    return store.get();
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get the ValueStore instance that is linked to the specified key
   *
   * @param {string} [key] - Key part of the key-value pair
   *
   * @param {mixed} [defaultValue=undefined]
   *   Default value to set if a storage is created
   *
   * @returns {*} Store that keeps the value for the specified key
   */
  getStore( key, defaultValue )
  {
    let store = super.get( key );

    if( store instanceof Object )
    {
      return store;
    }

    // -- Automatically create a store

    store = new ValueStore( defaultValue );

    super.set( key, store );

    return store;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get an object with all stored key-value pairs
   */
  getObject()
  {
    const obj = {};

    for( const key of this.keys() )
    {
      obj [ key ] = super.get( key ).get();
    }

    return obj;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Update the currently stored value
   *
   * @param {string} [key] - Key part of the key-value pair
   *
   * @param {function} [updateFn]
   *   Function that receives the current value and returns an updated value
   */
  update( key, updateFn )
  {
    expectDefined( key, "Missing or invalid parameter [key]" );
    expectFunction( updateFn, "Missing or invalid parameter [updateFn]" );

    let store = super.get( key );

    if( !(store instanceof ValueStore) )
    {
      store = new ValueStore();
      super.set( key, newStore );
    }

    return store.update( key, updateFn );
  }

  /* ------------------------------------------------------- Internal methods */

} // end class

