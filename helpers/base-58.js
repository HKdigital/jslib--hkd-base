/**
 * base-58.js
 *
 * @description
 * This file contains code for working with base 58 encoding
 *
 * @example
 *
 *   import { base58fromNumber } from "./base-58.js";
 *
 *   console.log( base58fromNumber( 1234513245 ) ) // base 58 encoded string
 */

/* ------------------------------------------------------------------ Imports */

import { expectString } from "../helpers/expect.js";

/* ------------------------------------------------------------------ Exports */

// Base 58 helper functions
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
const BASE_SIZE = BigInt(ALPHABET_BASE_58.length);

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

  if( typeof num !== "bigint" )
  {
    if( Number.isNaN( num ) ||
        num < 0 ||
        num > Number.MAX_SAFE_INTEGER ||
        Math.floor( num ) !== num )
    {
      throw new Error(
        "Invalid parameter [num], expected not negative safe integer");
    }

    num = BigInt(num);
  }

  while( num >= BASE_SIZE )
  {
    let mod = num % BASE_SIZE;
    str = ALPHABET_BASE_58[ mod ] + str;

    // num = Math.floor( num / BASE_SIZE );
    //
    num = num / BASE_SIZE; // BigInts are integers, automatically rounded down

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

// -----------------------------------------------------------------------------

/**
 * Convert a string encoded as base 58 to a number (BigInt)
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

  let num = BigInt(0);

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

    num = num + BigInt(value) * BigInt(58) ** BigInt( n_1 - j );

    // console.log("num", num );

  } // end for

  return num;
}

// -----------------------------------------------------------------------------

/**
 * Convert a base58 encoded string to an Uint8Array (bytes)
 * - A base58 encoded string actually represents a (potentially very big)
 *   number. This method converts that number into a bytes representation
 * - A byte can hold 256 values, a base58 character only 58, so there will be
 *   less bytes needed to encode the value of the base58 encoded string
 *
 * @param {string} str - String to convert
 *
 * @returns {Uint8Array} bytes that represent the base58 encoded string value
 */
export function base58toBytes( str )
{
  const num = base58toNumber( str );

  let numBase16 = num.toString(16);

  if( 1 === numBase16.length % 2 )
  {
    //
    // String contains inpair number of characters -> prefix a "0"
    //
    numBase16 = "0" + numBase16;
  }

  const n = numBase16.length;

  const out = new Uint8Array( numBase16.length >> 1 );

  for( let j = n - 1; j > 0; j = j - 2 )
  {
    const low16 = parseInt( numBase16[ j ], 16 );
    const high16 = parseInt( numBase16[ j - 1 ], 16 );

  //   // const low16 = (j < n_1) ? parseInt(numBase16[ j + 1 ], 10) : 0;

  //   const low16 = (j < n_1) ? parseInt( numBase16[ j + 1 ], 16 ) : 0;

    const value256 = (high16 << 4) + low16;

    out[ j >> 1 ] = value256;

    // console.log(
    //   {
    //     numBase16,
    //     n,
    //     j,
    //     high16,
    //     low16,
    //     value256,
    //     out
    //   } );

  } // end for

  return out;
}

// -----------------------------------------------------------------------------

/**
 * Convert a base58 encoded string to a (base256) byte string
 *
 * @param {string} str
 *
 * @returns {string} byte string
 */
export function base58toByteString( str )
{
  return new TextDecoder().decode( base58toBytes( str ) );
}

// -----------------------------------------------------------------------------

/**
 * Convert bytes to number
 *
 * @param {Uint8Array} bytes
 *
 * @returns {BigInt} numeric value
 */
export function bytesToNumber( bytes )
{
  let sum = BigInt(0);

  // console.log( "check", bytes.length );

  for( let j = 0, n = bytes.length; j < n; j = j + 1 )
  {
    const base = BigInt(256) ** BigInt( n - 1 - j );
    const value = bytes[ j ];

    // console.log(
    //   {
    //     base,
    //     value
    //   } );

    sum = sum + base * BigInt( value );
  }

  return sum;
}
