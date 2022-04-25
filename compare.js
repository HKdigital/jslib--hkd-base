
/* ------------------------------------------------------------------ Imports */

import { objectGet } from "@hk/object.js";

/* ------------------------------------------------------------------ Exports */

/**
 * Check if the values of two variables should be considered the same
 *
 * @param  {mixed} value1 - First value for comparison
 * @param  {mixed} value2 - Second value for comparison
 *
 * @return {boolean} true if the two values can be considered the same
 */
 export function equals( value1, value2, _pendingComparisons )
 {
   // -- Basic sameness comparisons

   if( typeof value1 !== typeof value2 )
   {
     // Not the same [type]
     return false;
   }

   if( !(value1 instanceof Object) && value1 !== value2 )
   {
     // [Not an object] and [not the same value]
     return false;
   }

   if( value1 === value2 )
   {
     // [same value or same object reference]
     return true;
   }

   if( value1 === null || value2 === null )
   {
     // [one of the values is null, the other an object]
     return false;
   }

   // -- Check if variables are already being compared

   if( !_pendingComparisons )
   {
     _pendingComparisons = { value1: [], value2: [] };
   }
   else {
     const values1 = _pendingComparisons.value1;
     const values2 = _pendingComparisons.value2;

     if( values1.length > 0 )
     {
       const foundIndex = values1.indexOf( value1 );

       if( -1 !== foundIndex && values2[ foundIndex ] === value2 )
       {
         // Objects comparison in progress (it's safe to return true),
         // since equals will fail on other place if objects differ
         return true;
       }
     }
   }

   // -- Compare special objects

   switch( value1.constructor )
   {
     // Implement other special objects here.

     case RegExp:
       if( value1.toString() === value2.toString() )
       {
         return true;
       }
       return false;

     case Date:
       if( value1.getTime() === value2.getTime() )
       {
         return true;
       }
       return false;
   }

   // -- Check if both objects have the same properties

   for( const prop in value1 )
   {
     if( undefined === value2[ prop ] &&
         undefined !== value1[ prop ] )
     {
       // (defined) property found in value1 that is undefined in value2
       return false;
     }
   }

   for( const prop in value2 )
   {
     if( undefined === value1[ prop ] &&
         undefined !== value2[ prop ] )
     {
       // (defined) property found in value2 that is undefined in value1
       return false;
     }
   }

   // -- Check each property for sameness

   _pendingComparisons.value1.push( value1 );
   _pendingComparisons.value2.push( value2 );

   for( const prop in value1 )
   {
     if( false === equals( value1[prop], value2[prop], _pendingComparisons ) )
     {
       return false;
     }
   }

   return true;
 }

// ---------------------------------------------------------------------- Method

/**
 * Compare function that can be used for sorting smallest values first
 *
 * @param {mixed} x - First value
 * @param {mixed} y - Second value
 */
export function smallestFirst( x, y )
{
  if( typeof x === "undefined" )
  {
    if( typeof y === "undefined" )
    {
      return 0;
    }

    return 1;
  }

  if( typeof y === "undefined" )
  {
    return -1;
  }

  return ( (x < y) ? -1 : ((x > y) ? 1 : 0) );
}

// ---------------------------------------------------------------------- Method

/**
 * Compare function that can be used for sorting largest values first
 *
 * @param {mixed} x - First value
 * @param {mixed} y - Second value
 */
export function largestFirst( x, y )
{
  if( typeof x === "undefined" )
  {
    if( typeof y === "undefined" )
    {
      return 0;
    }

    return 1;
  }

  if( typeof y === "undefined" )
  {
    return -1;
  }

  return ( (x < y) ? 1 : ((x > y) ? -1 : 0) );
}

// ---------------------------------------------------------------------- Method

/**
 * Comparator that can be used for sorting using an object path
 *
 * @param {function} compareFn - Function to use to compare the values
 *
 * @param {mixed} a - First value
 * @param {mixed} b - Second value
 *
 * @param {string|string[]} path - Object path
 */
export function compareUsingPath( compareFn, a, b, path )
{


  // @note assume a and b are objects

  const valueA = objectGet( a, path );
  const valueB = objectGet( b, path );

  return compareFn( valueA, valueB );
}

// ---------------------------------------------------------------------- Method

/**
 * Comparator that can be used for sorting using an object key
 *
 * @param {function} compareFn - Function to use to compare the values
 * @param {string|string[]} path - Object path
 *
 * @param {mixed} x - First value
 * @param {mixed} y - Second value
 */
export function compareUsingKey( compareFn, key, a, b )
{
  // @note assume a and b are objects

  return compareFn( a[ key ], b[ key ] );
}
