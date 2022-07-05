/**
 * Selector.js
 *
 * @description
 * This file contains a class that can be used to select items from lists of
 * objects.
 *
 * @TODO
 * Currently the selector only performs **exact** (key-value pair) matches
 *
 * @example
 *
 *   import Selector from "./Selector.js";
 *
 *   const selector = new Selector( { age: 42 } );
 *
 *   const items =
 *     [
 *       { name: "Maria", age: 41 },
 *       { name: "John",  age: 42 },
 *       { name: "Max", age: 43 }
 *     ]
 *
 *   const item = selector.findFirst( items );
 *
 *   console.log( item );
 */

/* ------------------------------------------------------------------ Imports */

import { expectObjectOrNull } from "../helpers/expect.js";

/* ---------------------------------------------------------------- Internals */

/* ------------------------------------------------------------------- Export */

/**
 * Construct a Selector class
 */
export default class Selector
{
  //_matches = null;

  /**
   * Constructor
   *
   * @param {object|null} selector
   */
  constructor( selector )
  {
    this._updateMatchesFn( selector );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Returns the first item from the list of items that matches the selector
   *
   * @param {object[]|null} items
   *
   * @returns {object|null} item or null if not found
   */
  findFirst( items )
  {
    if( !items )
    {
      return null;
    }

    for( const item of items )
    {
      if( this._matches( item ) )
      {
        return item;
      }
    }

    return null;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Returns all items from the list of items that match the selector
   *
   * @param {object[]|null} items
   *
   * @returns {object|null} item or null if not found
   */
  findAll( items )
  {
    const result = [];

    if( !items )
    {
      return result;
    }

    for( const item of items )
    {
      if( this._matches( item ) )
      {
        result.push( item );
      }
    }

    return result;
  }

  /* ------------------------------------------------------- Internal methods */

  /**
   * Update the internal selector function
   */
  _updateMatchesFn( selector )
  {
    // == Case A: selector=null

    if( null === selector )
    {
      this._matches = this._returnTrue;
      return;
    }

    // == Validate selector

    expectObjectOrNull( selector,
      "Invalid value for parameter [selector]" );

    const keys = Object.keys( selector );
    const n = keys.length;

    // == Case B: selector has not properties

    if( !n )
    {
      this._matches = this._returnTrue;
      return;
    }

    // == Case C: selector with single key-value pair

    if( 1 === n )
    {
      const key = keys[0];
      const value = selector[ key ];

      this._matches = this._matchKeyValue.bind( this, key, value );
    }

    // == Case C: selector with multiple key-value pairs

    const selectorValues = [];

    for( const key of keys )
    {
      selectorValues.push( selector[ key ] );
    }

    this._matches =
      this._matchMultipleKeyValues.bind( this, keys, selectorValues );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Always return true
   *
   * @returns {boolean} true
   */
  _returnTrue()
  {
    return true;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Return true if the item matches the key-value pair
   */
  _matchKeyValue( key, value, item )
  {
    return value === item[ key ];
  }

  // -------------------------------------------------------------------- Method

  /**
   * Return true if the item matches all key-value pairs
   */
  _matchMultipleKeyValues( keys, values, item )
  {
    let isMatch = true;

    for( let j = 0, n = keys.length; j < n; j = j + 1 )
    {
      if( values[ j ] !== item[ keys[ j ] ] )
      {
        isMatch = false;
        break;
      }
    } // end for

    return isMatch;
  }

} // end class