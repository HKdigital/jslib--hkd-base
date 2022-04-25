
/* ------------------------------------------------------------------ Imports */

import {
  expectString,
  expectObject,
  expectArray,
  expectFunction,
  expectArrayLike,
  expectArrayOfStrings} from "./expect.js";

import {
  smallestFirst,
  largestFirst,
  compareUsingKey,
  compareUsingPath } from "./compare.js";

import { objectGet, PATH_SEPARATOR } from "./object.js";

import Selector from "./classes/Selector.js";

/* ---------------------------------------------------------------- Internals */

const array_slice = Array.prototype.slice;

/* ------------------------------------------------------------------ Exports */

export { PATH_SEPARATOR } from "./object.js";

// ---------------------------------------------------------------------- Method

/**
 * Convert a value to an array
 * - Converts an Arguments object to plain JS array
 * - If the value is undefined or null, an empty array is returned
 * - A primitive value is "wrapped" in an array
 *
 * @param {mixed} value - Item to convert
 *
 * @param {number} [start]
 *   Index of the array to start extraction.
 *   (the first element of the array is at index 0)
 *
 * @param {number} [end]
 *   Index of the array where the extraction should end
 *
 * --
 *
 * @returns {Array} array
 *
 * --
 *
 * @example
 *   toArray( [ 1, 2, 3, 4, 5 ], 2, 4 ) returns [ 3, 4 ]
 */
export function toArray( value, start, end )
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

  if( undefined === value || null === value )
  {
    //
    // Return an empty array if value is undefined or null
    //
    // ==> this behaviour differs from Array.from() <==
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
 * Convert an async iterator to an array
 * - If no async iterator is passed, the value will be processed by `from()`
 *
 * @param {AsyncIterator|mixed} value
 *   Async iterator or value to convert to array
 *
 * @returns {Array} list of items returned by the iterator
 */
export async function toArrayAsync( value )
{
  if( (value instanceof Object) &&
      typeof value[ Symbol.asyncIterator ] === "function" )
  {
    // value is an async iterator

    const arr = [];

    for await (const item of value)
    {
      arr.push( item );
    }

    return arr;
  }
  else {
    // value is not an async iterator

    return toArray( value );
  }
}

// ---------------------------------------------------------------------- Method

/**
 * Convert a path string to an array path
 * - The path string will be spit at the `pathSeparator` token
 * - If the supplied path is already an array, the original array will
 *   be returned
 *
 * @param {string|string[]} path
 *   String or array path (e.g. "some.path.to")
 *
 * @param {string} [pathSeparator=PATH_SEPARATOR]
 *   A custom path separator to use instead of the default "."
 *
 * @returns {string[]} array path (e.g. ["some", "path", "to"])
 */
export function toArrayPath( path, pathSeparator=PATH_SEPARATOR )
{
  if( typeof path === "string" )
  {
    return path.split( pathSeparator );
  }
  else if( Array.isArray( path ) )
  {
    // path is already an array
    return path;
  }
  else {
    throw new Error(
      "Missing or invalid parameter [path] (expected string or array)");
  }
}

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
  expectFunction( callback, "Missing or invalid parameter [callback]" );

  if( !arr )
  {
    return;
  }

  expectArray( arr, "Missing or invalid parameter [arr]" );

  if( !arr.length )
  {
    // Nothing to do
    return;
  }

  // >> CASE A: no additional arguments

  if( !additionalArguments )
  {
    for( let j = 0, n = arr.length; j < n; j = j + 1 )
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
 * @param {boolean} [options.outputAsSet=false]
 *   Output a Set instead of an array
 *
 * @param {string} [options.pathSeparator=PATH_SEPARATOR]
 *   A custom path separator to use instead of the default "."
 *
 *
 *
 * @returns {mixed[]} values
 */
export function pathValues( items, path, options={} )
{
  // == Process parameters

  expectArray( items,
    "Missing or invalid parameter [items]" );

  const { outputAsSet=false, pathSeparator=PATH_SEPARATOR } = options;

  if( typeof path === "string" )
  {
    path = toArrayPath( path, pathSeparator );
  }
  else {
    expectArrayOfStrings( path, "Missing or invalid parameter [path]" );
  }

  // >> CASE A: Output as plain Array

  if( !outputAsSet )
  {
    const values = [];

    for( let j = 0, n = items.length; j < n; j = j + 1 )
    {
      const item = items[j];

      expectObject( item, `Invalid array item[${j}]` );

      values.push( objectGet( item, path ) );
    }

    return values;
  }

  // >> CASE B: Output as Set

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
 * @param {function} comparator_fn
 *   Comparator function (e.g. compareUsingPath)
 *
 * @param {Array} arr - Array to sort
 * @param {string} path - Path to use for sorting
 *
 * @param {object} [options] - Options
 * @param {function} [options.customCompareFn] - Custom compare function
 * @param {function} [options.reversed=false] - Sort in reversed order
 * @param {function} [options.natsort=false] - Use natural sort for strings
 */
// export function sort( comparator_fn, arr, path, options )
// {
//   expectFunction( comparator_fn,
//     "Missing or invalid parameter [comparator_fn]" );

//   expectArray( arr, "Invalid or missing parameter [arr]" );

//   expectString( path, "Invalid or missing parameter [path]");

//   if( options )
//   {
//     expectObject( options, "Invalid parameter [options]");
//   }

//   let compareFn;

//   options =
//     Object.assign( { customCompareFn: null, reversed: false }, options );

//   if( options.customCompareFn )
//   {
//     compareFn = options.customCompareFn;
//   }
//   else if( options.reversed )
//   {
//     if( !options.natsort )
//     {
//       compareFn = largestFirst;
//     }
//     else {
//       // new Intl.Collator('nl').compare);

//       throw new Error("Not implemented yet");
//     }
//   }
//   else {
//     if( !options.natsort )
//     {
//       compareFn = smallestFirst;
//     }
//     else {
//       throw new Error("Not implemented yet");
//     }
//   }

//   // if( path )
//   // {

//   // }

//   arr.sort( comparator_fn.bind( null, compareFn, path ) );
// }

// ---------------------------------------------------------------------- Method

/**
 * Sort function that sorts a list of objects by values encountered at the
 * specified key values of the object.
 * - Sorts array inline (no new array is returned)
 * - This method is faster than `sortByPathValue` since the value lookup in the
 *   items can be done faster
 *
 * @param {Object[]} items - List of items to sort
 *
 * @param {string} key
 *   Object key to use for getting the values in the items to compare.
 *
 * @param {function} [compareFn=smallestFirst]
 *   Function to use to compare values. See `compare.js`.
 */
export function sortByKeyValue( items, key, compareFn=smallestFirst )
{
  expectFunction( compareFn,
    "Missing or invalid parameter [compareFn]" );

  expectArray( items, "Invalid or missing parameter [items]" );

  expectString( key, "Invalid parameter [key]");

  items.sort( ( itemA, itemB ) => {

    return compareFn( itemA[ key ], itemB[ key ] );
  } );
}

// ---------------------------------------------------------------------- Method

/**
 * Sort function that sorts a list of objects by values encountered at the
 * specified object path.
 * - Sorts array inline (no new array is returned)
 *
 * @param {Object[]} items - List of items to sort
 *
 * @param {string[]|string} path
 *   Path to use for getting the values in the items to compare.
 *   If a string path has been supplied, the default path separator
 *   (PATH_SEPARATOR) is assumed. Use `toArrayPath` to convert paths with
 *   custom path separators.
 *
 * @param {function} [compareFn=smallestFirst]
 *   Function to use to compare values. See `compare.js`.
 */
export function sortByPathValue( items, path, compareFn=smallestFirst )
{
  expectFunction( compareFn,
    "Missing or invalid parameter [compareFn]" );

  expectArray( items, "Invalid or missing parameter [items]" );

  if( typeof path === "string" )
  {
    path = toArrayPath( path );
  }
  else {
    expectArrayOfStrings( path, "Invalid parameter [path]");
  }

  const cache = new Map();

  items.sort( ( itemA, itemB ) => {

    let valueA = cache.get( itemA );

    if( undefined === valueA )
    {
      valueA = objectGet( itemA, path );

      if( undefined !== valueA )
      {
        cache.set( itemA, valueA );
      }
    }

    let valueB = cache.get( itemB );

    if( undefined === valueB )
    {
      valueB = objectGet( itemB, path );

      if( undefined !== valueB )
      {
        cache.set( itemB, valueB );
      }
    }

    return compareFn( valueA, valueB );
  } );

  cache.clear();
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
// export function sortByKeyValue()
// {
//   return sort( compareUsingKey, ...arguments );
// }

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
// export function sortByPathValue()
// {
//   return sort( compareUsingPath, ...arguments );
// }

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
