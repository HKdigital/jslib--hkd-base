
/* ------------------------------------------------------------------ Imports */

import {
  expectString,
  expectObject,
  expectArray,
  expectFunction,
  expectArrayLike,
  expectStringOrArrayOfStrings} from "$hk/expect.js";

import {
  smallestFirst,
  largestFirst,
  compareUsingKey,
  compareUsingPath } from "$hk/compare.js";

import { objectGet, PATH_SEPARATOR } from "$hk/object.js";

import Selector from "$hk/classes/Selector.js";

/* ---------------------------------------------------------------- Internals */

const array_slice = Array.prototype.slice;

/* ------------------------------------------------------------------ Exports */

// ---------------------------------------------------------------------- Method

/**
 * Convert an value to an array
 * - Converts Arguments object ot plain JS array
 * - If the value is undefined an empty array is returned
 * - Not array objects are "wrapped" in an array
 *
 * @param {mixed} value - Item to convert
 *
 * @param {number} [start] - Zero-based index at which to start extraction
 * @param {number} [end] - Zero-based index before which to end extraction
 *
 * @return {Array} array
 */
export function from( value, start, end )
{
  if( Array.isArray(value) )
  {
    //
    // Do not clone input value if it is already an array
    //
    // @note this behaviour differs from Array.from
    //
    if( undefined === start )
    {
      return value;
    }

    return value.slice( start, end );
  }

  if( undefined === value )
  {
    //
    // Return an empty array if value is undefined
    //
    // @note this behaviour differs from Array.from
    //
    return [];
  }
  else if( !(value instanceof Object) )
  {
    //
    // Wrap (non-object) in array (e.g. a string)
    //
    // @note this behaviour differs from Array.from
    //
    return [ value ];
  }

  if( undefined === start )
  {
    //
    // Construct a new array from the value
    //
    return Array.from( value );
  }
  else {
    return array_slice( value, start, end );
  }
}

// ---------------------------------------------------------------------- Method

/**
 * Convert string with slash [/] separated values to an array path
 * - If the supplied path is already an array, the original array will
 *   be returned
 *
 * @param {string|string[]} path - String or array path (e.g. "some/path/to")
 *
 * @returns {string[]} array path (e.g. ["some", "path", "to"])
 */
export function fromPath( path )
{
  if( typeof path === "string" )
  {
    return path.split( PATH_SEPARATOR );
  }
  else if( Array.isArray( path ) )
  {
    // Nothing to do
    return path;
  }
  else {
    throw new Error(
      "Missing or invalid parameter [path] (expected string or array)");
  }
}

// ---------------------------------------------------------------------- Method

//
// FIXME for await is not supported in all browsers!!!!
//
// UPDATE: Edge since 2020-01, all other browsers around 2018 -> can be enabled
//

/**
 * Convert an async iterator to an array
 *
 * @param {AsyncIterator} ait - Async iterator
 *
 * @returns {Array} list of items returned by the iterator
 */
// export function async fromAsync( ait )
// {
//   expect.asyncIterator( ait, "Missing or invalid parameter [ait]");

//   const result = [];

//   for await (const item of ait)
//   {
//     result.push( item );
//   }

//   return result;
// }

// ---------------------------------------------------------------------- Method

/**
 * Loop over the supplied array and call the callback for every element
 * - The callback will receive the current element of the array as
 *   first argument
 * - Via [additionalArguments], additional arguments may be supplied that
 *   will be passed to the callback function
 *
 * @param {array} arr - The array to loop
 * @param {function} callback - Callback to call for every element
 * @param {array} additionalArguments  The additional arguments
 */
export function loop( arr, callback, additionalArguments )
{
  expectArray( arr, "Missing or invalid parameter [arr]" );
  expectFunction( callback, "Missing or invalid parameter [callback]" );

  if( !arr.length )
  {
    // Nothing to do
    return;
  }

  // >> CASE A: no additional arguments

  if( !additionalArguments )
  {
    for( let j = 1, n = arr.length; j < n; j = j + 1 )
    {
      callback( arr[j] );
    }

    return;
  }

  // >> CASE B: additional arguments

  expectArrayLike( additionalArguments,
    "Invalid value for parameter [additionalArguments]" );

  const args = [ null, ...additionalArguments ];

  for( let j = 0, n = arr.length; j < n; j = j + 1 )
  {
    args[ 0 ] = arr[j];
    callback( ...args );
  }
}

// ---------------------------------------------------------------------- Method

/**
 * Get a list of all values from the items in the array at the
 * specified path
 *
 * @param {object[]} items
 *
 * @param {object} [options]
 *
 * @param {number} [options.sort] Sort direction (1=normal, -1=reversed)
 *
 * @param {boolean} [options.outputAsSet=false]
 *   Output a Set insetad of an array
 *
 * @returns {mixed[]} values
 */
export function pathValues( items, path, options={} )
{
  expectArray( items,
    "Missing or invalid parameter [items]" );

  expectStringOrArrayOfStrings( path,
    "Missing or invalid parameter [path]" );

  expectObject( options,
    "Missing or invalid parameter [options]" );

  const outputAsSet = options.outputAsSet;

  // >> Plain array output >>

  if( !outputAsSet )
  {
    const values = [];

    for( let j = 0, n = items.length; j < n; j = j + 1 )
    {
      const item = items[j];

      expectObject( item, `Invalid array item[${j}]` );

      values.push( objectGet( item, path ) );
    }

    if( undefined !== options.sort )
    {
      switch( options.sort )
      {
        case 1:
          values.sort( smallestFirst );
          break;

        case -1:
          values.sort( largestFirst );
          break;

        default:
          throw new Error(
           "Invalid value for parameter [options.sort] (expected 1 or -1)");
      }
    }

    return values;
  }

  // >> Output as Set >>

  const values = new Set();

  for( let j = 0, n = items.length; j < n; j = j + 1 )
  {
    const item = items[j];

    expectObject( item, `Invalid array item[${j}]` );

    values.add( objectGet( item, path ) );
  }

  return values;
}

// ---------------------------------------------------------------------- Method

/**
 * Generic sort function
 * - Sorts array inline (no new array is returned)
 *
 * @see methods `sortByKeyValue` and `sortByPathValue`
 *      for simple sort operations
 *
 * @param {function} comparator_fn - Comparator function (e.g. sortByKeyValue)
 *
 * @param {Array} arr - Array to sort
 * @param {string} path - Path to use for sorting
 *
 * @param {object} [options] - Options
 * @param {function} [options.customCompareFn] - Custom compare function
 * @param {function} [options.reversed=false] - Sort in reversed order
 * @param {function} [options.natsort=false] - Use natural sort for strings
 */
export function sort( comparator_fn, arr, path, options )
{
  expectArray( arr, "Invalid or missing parameter [arr]" );

  expectString( path, "Invalid or missing parameter [path]");

  if( options )
  {
    expectObject( options, "Invalid parameter [options]");
  }

  let compareFn;

  options =
    Object.assign( { customCompareFn: null, reversed: false }, options );

  if( options.customCompareFn )
  {
    compareFn = options.customCompareFn;
  }
  else if( options.reversed )
  {
    if( !options.natsort )
    {
      compareFn = largestFirst;
    }
    else {
      throw new Error("Not implemented yet");
    }
  }
  else {
    if( !options.natsort )
    {
      compareFn = smallestFirst;
    }
    else {
      throw new Error("Not implemented yet");
    }
  }

  arr.sort( comparator_fn.bind( null, compareFn, path ) );
}

// ---------------------------------------------------------------------- Method

/**
 * Sort an array of objects by a single key value
 * - The sort operation changes the original object
 * - The default order is 'smallest value' first
 *
 * @param {Array} arr - Array to sort
 * @param {string} key - Key to use for sorting
 *
 * @param {object} [options] - Options
 * @param {function} [options.customCompareFn] - Custom compare function
 * @param {function} [options.reversed=false] - Sort in reversed order
 * @param {function} [options.natsort=false] - Use natural sort for strings
 */
export function sortByKeyValue()
{
  return sort( compareUsingKey, ...arguments );
}

// ---------------------------------------------------------------------- Method

/**
 * Sort an array of objects by a their value at the specified path
 * - The sort operation changes the original object
 * - The default order is 'smallest value' first
 *
 * @param {Array} arr - Array to sort
 * @param {string} path - Path to use for sorting
 *
 * @param {object} [options] - Options
 * @param {function} [options.customCompareFn] - Custom compare function
 * @param {function} [options.reversed=false] - Sort in reversed order
 * @param {function} [options.natsort=false] - Use natural sort for strings
 */
export function sortByPathValue()
{
  return sort( compareUsingPath, ...arguments );
}

// ---------------------------------------------------------------------- Method

/**
 * Find the first item in the list of objects that matches the selector
 * - All items in the supplied array must be objects
 *
 * @param {object[]} arr
 * @param {object|null} selector
 *
 * @returns {object|null} first matched item
 */
export function findFirst( arr, selector )
{
  const selectorObj = new Selector( selector );

  return selectorObj.findFirst( arr );
}

// ---------------------------------------------------------------------- Method

/**
 * Returns all items from the list of items that match the selector
 * - All items in the supplied array must be objects
 *
 * @param {object[]} arr
 * @param {object|null} selector
 *
 * @returns {object[]} matching items
 */
export function findAll( arr, selector )
{
  const selectorObj = new Selector( selector );

  return selectorObj.findAll( arr );
}
