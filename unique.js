
/* ------------------------------------------------------------------ Imports */

import {
  base58fromNumber,
  ALPHABET_BASE_58,
  ALPHABET_BASE_HUMAN } from "$hk/bases.js";

function vars() {} /* use function as object for hoisting */

function bootTimePrefix()
{
  if( !vars.bootTimePrefix )
  {
    vars.bootTimePrefix = "3" + getTwoChar10ms();
  }

  return vars.bootTimePrefix;
}

/* ------------------------------------------------------------------ Exports */

/**
 * Create a string that contains random characters from the base58 alphabet
 *
 * @param {string} [length=48]
 *
 * @returns {string} a base 58 encoded random string
 */
export function randomStringBase58( length=48 )
{
  return randomString( length, ALPHABET_BASE_58 );
}

/**
 * Create a string that contains random characters from a for human's not
 * ambiguous alphabet
 *
 * @param {string} [length=48]
 *
 * @returns {string} a human friendly encoded random string
 */
export function randomStringBaseHuman( length=48 )
{
  return randomString( length, ALPHABET_BASE_HUMAN );
}

/**
 * Create a string that contains random characters from the specified alphabet
 *
 * @param {string} [length=48]
 * @param {string} [ALPHABET=ALPHABET_BASE_58]
 *
 * @returns {string} a base 58 encoded random string
 */
export function randomString( length=48, ALPHABET=ALPHABET_BASE_58 )
{
  if( typeof length !== "number" || length < 1 )
  {
    throw new Error("Invalid parameter [length]");
  }

  if( typeof ALPHABET !== "string" || !ALPHABET.length )
  {
    throw new Error("Invalid parameter [ALPHABET]");
  }

  let str = "";

  const n = ALPHABET.length;

  for( let j = length; j > 0; j = j - 1 )
  {
    const num = n * Math.random() & -1;  // number [0...n-1]
    str += ALPHABET[ num ];
  }

  return str;
}

// ---------------------------------------------------------------------- Method

/**
 * Create an access code: a string that contains 48 random characters from the
 * base58 alphabet
 *
 * @returns {string} a base 58 encoded random string of length 48
 */
export function randomAccessCode()
{
  return randomStringBase58( 48 );
}

// ---------------------------------------------------------------------- Method

/**
 * Generate client session id
 *
 * @returns {string} a base 58 encoded random string of length 48
 */
export function generateClientSessionId()
{
  return randomStringBase58( 48 );
}

// ---------------------------------------------------------------------- Method

/**
 * Generates and returns a new unique local id
 * - The generated id is garanteed to be unique on the currently running
 *   local system
 *
 * @param {number} [timeMs]
 *   Custom time value to be used instead of Date.now()
 *
 * @returns {string} local id
 */
export function generateLocalId( timeMs )
{
  const timeBasedNumber = getTimeBasedNumber30s( timeMs );

  let timeBasedValue58;

  let countBasedNumber;

  if( vars.lastTimeBasedNumber !== timeBasedNumber )
  {
    // -- Time stamp based number changed -> reset counter to zero

    countBasedNumber =
      vars.lastCountBasedNumber = 0;

    // -- Calculate timeBasedValue58 and update cache

    vars.lastTimeBasedNumber = timeBasedNumber;

    timeBasedValue58 =
      vars.lastTimeBasedValue58 = base58fromNumber( timeBasedNumber );
  }
  else {
    // -- Same time stamp based number -> increment counter

    countBasedNumber =
      vars.lastCountBasedNumber = vars.lastCountBasedNumber + 1;

    // -- Use cached lastTimeBasedNumber

    timeBasedValue58 = vars.lastTimeBasedValue58;
  }

  const countBasedValue58 = base58fromNumber( countBasedNumber );

  // Combine parts into single identifier string
  //
  // @note ALPHABET_BASE_58 is used because it is faster than
  //       base58fromNumber for single character encoding
  //
  const id =
    // idFormatPrefix
    bootTimePrefix() +
    ALPHABET_BASE_58[ timeBasedValue58.length ] +
    timeBasedValue58 +
    countBasedValue58;

  // std.debug( id );

  return id;
}

// ---------------------------------------------------------------------- Method

/**
 * Returns a time based number that changes every 30 seconds
 *
 * @param {number} [timeMs]
 *   Custom time value to be used instead of Date.now()
 *
 * @returns {number} time based numerical that changes every 30 seconds
 */
export function getTimeBasedNumber30s( timeMs )
{
  const now = timeMs || Date.now();
  const jan2017 = 1483228800000;

  // @note
  // do not use bitwise shift since it only works on 32 bit numbers
  return Math.floor( (now - jan2017) / 30000 );
}

// ---------------------------------------------------------------------- Method

/**
 * Returns two character base58 encoded string that changes every 10
 * milliseconds
 *
 * - The function output changes every 9 milliseconds
 * - Returns a two character string
 * - The string is base58 encoded
 * - After 58 * 58 * 10ms = 33,6 seconds, the function output repeats
 *
 * @param {number} [timeMs]
 *   Custom time value to be used instead of Date.now()
 *
 * @returns {number} time based value
 */
export function getTwoChar10ms( timeMs )
{
  const now = timeMs || Date.now();

  // @note
  // do not use bitwise shift since it only works on 32 bit numbers
  const num = Math.floor( now / 10 ) % 3364;

  if( num >= 58 )
  {
    return base58fromNumber( num );
  }
  else {
    return "1" + base58fromNumber( num );
  }
}

// ---------------------------------------------------------------------- Method

// /**
//  * Get the time and count components from an id
//  * - Returns { valid: false } if the id is not valid and has no
//  *   time component
//  *
//  * @param {string} id
//  *
//  * @returns {object}
//  *  { time: <number>, count: <number>, valid: <boolean> }
//  */
// export function getTimeAndCountFromId( id )
// {
//   expectString( id, "Missing or invalid parameter [id]" );

//   // {
//   //   const firstChar = id.charAt( 0 );

//   //   if( "A" === firstChar )
//   //   {
//   //     // id starts with id format byte
//   //     // -> FIXME: switch between ALPHABET_BASE_58_MAP and legacy
//   //     id  = id.slice( 1 );
//   //   }
//   // }

//   const firstChar = id.charAt( 0 );


//   if( "3" !== firstChar )
//   {
//     // Custom id or unknown format -> default to 0
//     return { valid: false };
//   }

//   const idLength = id.length;

//   if( idLength <= 3 )
//   {
//     // Weird id -> valid=false
//     return { valid: false };
//   }

//   const fourthChar = id.charAt( 3 );

//   if( !ALPHABET_BASE_58_MAP.has( fourthChar ) )
//   {
//     // Weird id -> valid=false
//     return { valid: false };
//   }

//   const timeBasedValuelength = ALPHABET_BASE_58_MAP.get( fourthChar );

//   if( 4 + timeBasedValuelength >= idLength )
//   {
//     // Weird id -> valid=false
//     return { valid: false };
//   }

//   // std.debug(
//   // "check", id, timeBasedValuelength,
//   // id.slice( 4, 4 + timeBasedValuelength ) );

//   const timeBasedValue =
//     base58toNumber( id.slice( 4, 4 + timeBasedValuelength ), -1 );

//   if( -1 === timeBasedValue )
//   {
//     return { valid: false };
//   }

//   if( 4 + timeBasedValuelength >= idLength )
//   {
//     // Weird id -> valid=false
//     return { valid: false };
//   }

//   // std.debug( "check", id,  id.slice( 4 + timeBasedValuelength ) );

//   const countBasevalue =
//     base58toNumber( id.slice( 4 + timeBasedValuelength ), -1 );

//   if( -1 === countBasevalue )
//   {
//     return { valid: false };
//   }

//   return { time: timeBasedValue, count: countBasevalue, valid: true };
// }
