
import { expectString,
         expectArray } from "./expect.js";

/**
 * Returns a function that can check if a list of objects has changed
 *
 * @note This function only checks arrays of objects
 *
 *
 *
 * @param {object[]} initialArray - Initial array of objects
 * @param {string} [keys] - Keys to check
 *
 * @returns {function} function that can be used to check for changes
 */
export function createArrayChangedCheck( initialArray, keys )
{
  expectArray( initialArray,
    "Missing or invalid parameter [initialArray]" );

  expectArray( keys, "Missing or invalid parameter [keys]" );

  const valuesBefore = [];

  // -- Check and store initial values

  for( const item of initialArray )
  {
    if( !(item instanceof Object) )
    {
      throw new Error(
        "Invalid parameter [initialArray] (should be an array of objects)");
    }

    const tmp = {};

    for( const key of keys )
    {
      tmp[ key ] = item[ key ];
    }

    valuesBefore.push( tmp );

  } // end for

  return function( updatedArray )
  {
    expectArray( updatedArray,
      "Missing or invalid parameter [updatedArray]" );

    if( updatedArray.length !== initialArray.length )
    {
      return true; // changed
    }

    for( let j = 0, n = initialArray.length; j < n; j = j + 1 )
    {
      const item = updatedArray[ j ];

      if( !(item instanceof Object) )
      {
        throw new Error(
          "Invalid parameter [updatedArray] (should be an array of objects)");
      }

      // console.log( "changed?", initialArray, valuesBefore);

      for( const key of keys )
      {

        if( item[ key ] !== valuesBefore[ j ][ key ] )
        {
          return true; // changed
        }
      }
    }

    return false;
  };
}