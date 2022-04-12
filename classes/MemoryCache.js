/**
 * MemoryCache.js
 *
 * @description
 * This file contains a class that can be used to cache key-value pairs in
 * memory.
 *
 * @example
 *
 *   import MemoryCache from "./Cache.js";
 *
 *   const cache = new MemoryCache();
 *
 *   cache.set( "text", { str: "Hello World" }, { ttl: 5000 } )
 *
 *   console.log( cache.get("text") );
 */

/* ------------------------------------------------------------------ Imports */

import { expectArrayOfStrings,
         expectPositiveNumber,
         expectDefined } from "$hk/expect.js";

/* ---------------------------------------------------------------- Internals */

const CLEANUP_INTERVAL_MS = 10000;
const DEFAULT_TTL_MS = 1000;

const NO_EXPIRATION_TIME = -1;

/* ------------------------------------------------------------------- Export */

/**
 * Construct a MemoryCache class
 */
export default class MemoryCache
{
  // #defaultTTL

  /**
   * Construct a memory cache
   *
   * @param {object} [options] - Caching options
   * @param {object} [options.defaultCacheItemValidMs=1000]
   *   Default time that a cache item is valid.
   *   A value of -1 means that the items do not expire
   */
  constructor( { defaultTTL=DEFAULT_TTL_MS }={} )
  {
    // == Process input parameters

    expectPositiveNumber( defaultTTL,
      "Missing or invalid parameter [defaultTTL]" );

    this._defaultTTL = defaultTTL;

    // == Create internal storage object (Map)

    this.storage = new Map();
  }

  /* ----------------------------------------------------------- User Methods */

  /**
   * Enable automatic cleanup of expired items
   * - If not enabled, items that are no longer requested will remain in cache
   *
   * @returns {function} cancelAutomaticCleanup
   */
  enableAutomaticCleanup()
  {
    if( this._cleanupTimer )
    {
      throw new Error("Automatic cleanup has already been enabled");
    }

    // == Enable cleanup loop

    if( !this._cleanupLoopBound )
    {
      this._cleanupLoopBound = this._runCleanupAndLoop.bind( this );
    }

    this.cleanupTimer =
      setTimeout( this._cleanupLoopBound, CLEANUP_INTERVAL_MS );

    // == Return cancelAutomaticCleanup function

    return () => {
      if( this._cleanupTimer )
      {
        clearTimeout( this._cleanupTimer );
        this._cleanupTimer = null;
      }
    };
  }

  // -------------------------------------------------------------------- Method

  /**
   * Store item in cache
   * - Updates an existing item if it exists
   *
   * @param {mixed} key - Key that is used to identify the item
   * @param {mixed} value - Data to store
   *
   * @param {object} [options]
   *
   * @param {number} [options.ttl]
   *   Number of milliseconds that the item should be cached.
   *   If set to -1, the item will not expire
   *
   * @param {number} [options.tags]
   *   Tags to add to the item (can be used to remove items)
   */
  set( key, value, { ttl=undefined, tags=null}={} )
  {
    expectDefined( key, "Missing or invalid parameter [key]");
    expectDefined( value, "Missing or invalid parameter [value]");

    if( tags )
    {
      expectArrayOfStrings( tags, "Invalid parameter [tags]");

      tags = new Set( tags );
    }

    if( undefined === ttl )
    {
      ttl = this._defaultTTL;
    }
    else {
      expectPositiveNumber( ttl, "Invalid parameter [options.ttl]");
    }

    let expiresAt;

    if( ttl !== NO_EXPIRATION_TIME )
    {
      expiresAt = Date.now() + ttl;
    }
    else {
      expiresAt = NO_EXPIRATION_TIME;
    }

    const item =
      {
        value,
        expiresAt,
        ttl,
        tags
      };

    const storage = this.storage;

    // const itemIsNew = !storage.has( key );

    storage.set( key, item );

    // if( itemIsNew )
    // {
    //   this.publish("added", key);
    // }
  }

  // ------------------------------------------------------------------ Method

  /**
   * Retrieve an item from memory cache
   * - Updates the TTL of an existing item if it exists
   *
   * @param {string} key - Key that specifies the item to retrieve
   *
   * @param {mixed} [notFoundValue=null]
   *   Value to return if no value was stored for the specified key.
   *
   * @param {object} [options]
   * @param {boolean} [options.updateTTL=true]
   *
   * @returns {mixed|null}
   *  the value that was stored for the specified key or the default value
   */
  get( key, defaultValue, { updateTTL=true }={} )
  {
    expectDefined( key, "Missing or invalid parameter [key]");

    const node = this.getNode( key, { updateTTL } );

    if( null === node )
    {
      if( arguments.length < 2 )
      {
        return null;
      }
      else {
        return defaultValue;
      }
    }

    return node.value;
  }

  // ------------------------------------------------------------------ Method

  /**
   * Get a node from memory cache
   * - Updates the TTL of an existing node if it exists
   *
   * @param {string} key - Key that specifies the node to retrieve
   *
   * @param {object} [options]
   * @param {boolean} [options.updateTTL=true]
   *
   * @returns {mixed|null}
   *  the value that was stored for the specified key or the default value
   */
  getNode( key, { updateTTL=true }={} )
  {
    expectDefined( key, "Missing or invalid parameter [key]");

    const node = this.storage.get( key );

    if( undefined === node )
    {
      return null;
    }

    if( NO_EXPIRATION_TIME === node.ttl )
    {
      return node;
    }

    const now = Date.now();

    if( now > node.expiresAt )
    {
      // Item has expired
      this.remove( key );
      return null;
    }

    // == Update expiresAt

    if( updateTTL )
    {
      // Update expiresAt
      node.expiresAt = Date.now() + node.ttl;
    }

    // -- Return value

    return node;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Check if an item exists in the cache (and has not been expired)
   * - Updates the TTL of an existing item if it exists
   *
   * @param {string} key - Key that specifies the item to retrieve
   *
   * @returns {boolean} true if the item exists in cache
   */
  exists( key )
  {
    expectDefined( key, "Missing or invalid parameter [key]");

    const item = this.storage.get( key );

    if( undefined === item )
    {
      return false;
    }

    if( item.ttl === -1 )
    {
      return true;
    }

    const now = now();

    if( now > item.expiresAt )
    {
      // Item has expired
      this.remove( key );

      return false;
    }

    // Update expiresAt
    item.expiresAt = now() + item.ttl;

    return true;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Remove an item from the cache
   *
   * @param {string} key - Key that specifies the item to remove
   */
  remove( key )
  {
    expectDefined( key, "Missing or invalid parameter [key]" );

    const storage = this.storage;

    const item = storage.get( key );

    if( undefined !== item )
    {
      storage.delete( key );

      // this.publish("removed", { key, valueBefore: item.value } );
    }
  }

  /* ------------------------------------------------------- Internal Methods */

  /**
   * Clean up all expired items and set timer to start the next cleanup
   * - Removes all expired items from the cache
   */
  _runCleanupAndLoop()
  {
    const storage = this.storage;

    const now = Date.now();

    for( let [ key, item ] of storage.entries() )
    {
      // hk.debug("TRY CLEANUP", key, item );

      if( item.ttl !== -1 && now > item.expiresAt )
      {
        // Cleanup cached item
        this.remove( key );
      }
    } // end for

    //

    this.cleanupTimer = setTimeout( this._cleanupBound, CLEANUP_INTERVAL_MS );
  }

}