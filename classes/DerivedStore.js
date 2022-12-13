/**
 * DerivedStore.js
 *
 * @description
 * This file contains a ValueStore class that derives its values from other
 * stores.
 *
 * @example
 *
 *   import ValueStore from "./ValueStore.js";
 *   import DerivedStore from "./DerivedStore.js";
 *
 *   const store1 = new ValueStore( 1 );
 *   const store2 = new ValueStore( 2 );
 *
 *   const derivedStore = new DerivedStore(
 *     store1, store2,
 *     function derive( storesMap )
 *     {
 *       return storesMap.get(0).get() + storesMap.get(1).get();
 *     } );
 *
 *   const value = derivedStore.get(); // 3
 *
 *   derivedStore.subscribe( ( value, unsubscribe ) =>
 *   {
 *     console.log( value ); // 3
 *     unsubscribe();
 *   } );
 */

/* ------------------------------------------------------------------ Imports */

import { expectFunction } from "../helpers/expect.js";
import ValueStore from "./ValueStore.js";

/* ---------------------------------------------------------------- Internals */

const subscribers$ = Symbol("subscribers$");

const deriveFn$ = Symbol("deriveFn");
const stores$ = Symbol("stores");

const inputUnsubscribers$ = Symbol("inputUnsubscribers");
const destroyed$ = Symbol("destroyed");

const unsubscribeFromHasSubscribers$ = Symbol("unsubscribeFromHasSubscribers");

const currentValue$ = Symbol("currentValue");

/* ------------------------------------------------------------------- Export */

/**
 * DerivedStore
 * - Store that returns values that are derived from other Store instances
 */
export default class DerivedStore
{
  /**
   * Constructor
   *
   * @param {Map<string,object>|object[]} [stores] - Input store instances
   *
   * @param {DerivedStore~deriveFn} [deriveFn]
   *   Function that will be called to generate the derived value
   *
   *
   * This callback is displayed as part of the DerivedStore class.
   * @callback DerivedStore~deriveFn
   * @param {Map} stores - Map that contains the input store instances
   */
  constructor( stores, deriveFn )
  {
    if( stores instanceof Array )
    {
      const m = new Map();

      for( let j = 0, n = stores.length; j < n; j = j + 1 )
      {
        m.set( j, stores[j] );
      }

      this[ stores$ ] = m;
    }
    else if( stores instanceof Map )
    {
      this[ stores$ ] = stores;
    }
    else {
      throw new Error("Invalid parameter [stores] (expected Map or Array)");
    }

    expectFunction( deriveFn,
      "Missing or invalid parameter [deriveFn]" );

    // Pass property `enableHasSubscribers`,
    // value is not used, so leave it `undefined`
    // super( undefined, enableHasSubscribers );

    this[ subscribers$ ] = new Set();

    this[ destroyed$ ] = false;

    this[ deriveFn$ ] = deriveFn;

    this[ currentValue$ ] = undefined;

    this.hasSubscribers = new ValueStore( false, false );

    // -- Setup auto subscribe to input stores

    const inputUnsubscribers =
      this[ inputUnsubscribers$ ] = new Map();

    const callSubscribersBound = this._callSubscribers.bind( this );

    this[ unsubscribeFromHasSubscribers$ ] =
      this.hasSubscribers.subscribe( ( hasSubscribers ) =>
        {
          if( hasSubscribers )
          {
            for( const store of stores )
            {
              if( inputUnsubscribers.has( store ) )
              {
                throw new Error(`Duplicate input store instance`);
              }

              const unsubscribe = store.subscribe( callSubscribersBound );

              inputUnsubscribers.set( store, unsubscribe );
            }
          }
          else {
            // No subscribers (anymore) -> remove input store subscribers
            for( const unsubscribe of inputUnsubscribers.values() )
            {
              unsubscribe();
            }

            inputUnsubscribers.clear();
          }
        } );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Destroy instance
   * - Removes all subscribers from the derived store
   * - Unsubscribes from all input stores
   */
  destroy()
  {
    if( this[ destroyed$ ] )
    {
      throw new Error("The derived store has already been destroyed");
    }

    this[ destroyed$ ] = true;

    this.unsubscribeAll();

    const unsubscribers = this[ inputUnsubscribers$ ];

    for( const unsubscribe of unsubscribers.values() )
    {
      unsubscribe();
    }

    unsubscribers.clear();

    this[ unsubscribeFromHasSubscribers$ ]();

    this[ unsubscribeFromHasSubscribers$ ] = null;

    this[ currentValue$ ] = undefined;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Register a callback that will be called when a value of one of the input
   * stores is updated
   *
   * @param {function} callback
   *
   * @returns {function} unsubscribe function
   */
  subscribe( callback, callOnRegistration=true )
  {
    if( this[ destroyed$ ] )
    {
      throw new Error("Cannot subscribe. The derived store has been destroyed");
    }

    expectFunction( callback, "Missing or invalid parameter [callback]" );

    if( this[ subscribers$ ].has( callback ) )
    {
      throw new Error("Callback has already been registered");
    }

    this[ subscribers$ ].add( callback );

    if( 1 === this[ subscribers$ ].size )
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
      this[ subscribers$ ].delete( callback );

      if( 0 === this[ subscribers$ ].size )
      {
        // Last subscriber
        if( this.hasSubscribers )
        {
          this.hasSubscribers.set( false );
        }
      }
    }

    // -- Call callback directly upon registration (if value was set)

    const value = this.get();

    if( undefined !== value && callOnRegistration )
    {
      callback( value, unsubscribe );
    }

    // -- Return unsubscribe function

    return unsubscribe;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get the current value based on the currently stored values in the
   * input stores (using `get()`).
   * - Note that the `get()` method of stores does *not* set the
   *   `hasSubscribers` property of stores.
   */
  get()
  {
    if( this[ destroyed$ ] )
    {
      throw new Error("Cannot get value. The derived store has been destroyed");
    }

    return this[ deriveFn$ ]( this[ stores$ ] );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Block storing of a value
   *
   * @throws {Error}
   */
  set()
  {
    throw new Error("Cannot set a value on a derived store");
  }

  // -------------------------------------------------------------------- Method

  /**
   * Block updating a value
   */
  update()
  {
    throw new Error("Cannot update a value of a derived store");
  }

  /* ------------------------------------------------------- Internal methods */

  /**
   * Call all registered callbacks with the derived value as argument
   */
  _callSubscribers()
  {
    const value = this[ deriveFn$ ]( this[ stores$ ] );

    if( value === this[ currentValue$ ] )
    {
      // ignore (dedup)
      return;
    }

    this[ currentValue$ ] = value;

    for( const callback of this[ subscribers$ ].values() )
    {
      callback( value );
    }
  }

} // end class

