/**
 * base58.js
 *
 * @description
 * This file contains code for working with base58 encoding
 *
 * @example
 *
 *   import { base58fromNumber } from "./base58.js";
 *
 *   console.log( base58fromNumber( 1234513245 ) ) // base 58 encoded string
 */

/* ------------------------------------------------------------------ Imports */

import { expectString } from "$hk/expect.js";

/* ------------------------------------------------------------------ Exports */

// Base58 helper functions
//
// Inspired by
//   https://github.com/jimeh/node-base58/blob/master/src/base58.js
//
// @note
//   Two different commonly used alphabets exist
//
//   Bitcoin, IPFS (respects default sort order):
//     123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
//
//   Short URLs for Flickr
//     123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ
//
// @see https://en.wikipedia.org/wiki/StdBase58Helper
//

export const ALPHABET_BASE_58 =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

//export
const BASE_SIZE = ALPHABET_BASE_58.length;

// Create a lookup table to fetch character index

export const ALPHABET_BASE_58_MAP =
  new Map( [...ALPHABET_BASE_58].map( ( char, index ) => [ char, index ] ) );

// ---------------------------------------------------------------------- Method

/**
 * Convert a number to a base 58 encoded string
 *
 * @param {number} num - Number to encode
 *
 * @returns {string} string encoded using base 58
 */
export function base58fromNumber( num )
{
  let str = "";

  num = Number(num);

  if( isNaN( num ) ||
      num < 0 ||
      num > Number.MAX_SAFE_INTEGER ||
      Math.floor( num ) !== num )
  {
    throw new Error(
      "Invalid parameter [num], expected not negative safe integer");
  }

  while( num >= BASE_SIZE )
  {
    let mod = num % BASE_SIZE;
    str = ALPHABET_BASE_58[ mod ] + str;
    num = Math.floor( num / BASE_SIZE );
  }

  return ALPHABET_BASE_58[ num ] + str;
}

// ---------------------------------------------------------------------- Method

/**
 * Returns true if the specified string only contains base 58 characters
 *
 * @param {} str [description]
 *
 * @returns {boolean} true if the string only contains base 58 characters
 */
export function isBase58( str )
{
  expectString( str, "Missing or invalid parameter [str]" );

  for( let j = 0, n = str.length; j < n; j = j + 1 )
  {
    const char = str.charAt(j);
    if( !ALPHABET_BASE_58_MAP.has( char ) )
    {
      return false;
    }
  } // end for

  return true;
}

// ---------------------------------------------------------------------- Method

/**
 * Convert a string encoded as base 58 to a number
 *
 * @param {string} str - String to decode
 *
 * @param {number} [exceptionValue]
 *   If specified, the exceptionValue will be returned instead of
 *   throwing an exception
 *
 * @returns {number} decoded decimal numerical representation
 */
export function base58toNumber( str, exceptionValue )
{
  expectString( str, "Missing or invalid parameter [str]" );

  let num = 0;

  let n = str.length;
  let n_1 = n - 1;

  for( let j = 0; j < n; j = j + 1 )
  {
    const char = str.charAt(j);
    const value = ALPHABET_BASE_58_MAP.get( char );

    if( value === undefined )
    {
      if( 1 === arguments.length )
      {
        throw new Error(
          `Invalid character [${char}] found in string (expected base58`);
      }
      else {
        return exceptionValue;
      }
    }

    num = num + value * Math.pow( 58, n_1 - j );
  } // end for

  return num;
}
