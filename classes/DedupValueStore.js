/**
 * DedupValueStore.js
 *
 * @description
 * This file is a ValueStore, but won't call subscribers when a value that is
 * set is the same as the currently stored value.
 *
 * @example
 *
 *   import DedupValueStore from "./DedupValueStore.js";
 *
 *   const store = new DedupValueStore();
 *
 *   store.subscribe( ... );
 *
 *   store.set( 123 );
 *   store.set( 123 );  // subscriber won;t be called
 */

/* ------------------------------------------------------------------ Imports */

import { expectDefined } from "$hk/expect.js";

import { value$, default as ValueStore } from "$hk/classes/ValueStore.js";

/* ------------------------------------------------------------------- Export */

/**
 * DedupValueStore
 * - Class that can be used to store a value and subscribe to value changes
 *
 * - This class exposes a property [hasSubscribers], which is a ValueStore,
 *   that contains the value true or false. This property can be used to
 *   let code react if the first subscriber registered or the last subscriber
 *   unregistered.
 */
export default class DedupValueStore extends ValueStore
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
  constructor( initialValue, enableHasSubscribers=true )
  {
    super( ...arguments );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Store a new value
   * - Subscribers won't be called if the value set equals the actual
   *   stored value
   *
   * @param {mixed} [value] - Value to store
   */
  set( value )
  {
    // expectDefined( value, "Missing parameter [value]" );

    if( arguments.length < 1 )
    {
      throw new Error( "Missing parameter [value]" );
    }

    if( this[ value$ ] === value )
    {
      return;
    }

    // *** FIXME: make this also work for not primitive values using equals

    this[ value$ ] = value;

    this._callSubscribers();
  }

} // end class

