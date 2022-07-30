/**
 * time.js
 *
 * @description
 * This file contains time related functionality
 *
 * @example
 *
 *   import { delay, now } from './time.js';
 *
 *   async function test()
 *   {
 *     console.log( `Current timestamp [${now()}]` );
 *
 *     await delay( 1000 );
 *
 *     console.log( `Current timestamp [${now()}]` );
 *   }
 */

/* ------------------------------------------------------------------ Imports */

import { expectPositiveNumber } from "./expect.js";
import { HkPromise } from "./promises.js";

/* ---------------------------------------------------------------- Internals */

let _aheadOfReferenceTimeMs = 0;

/* ------------------------------------------------------------------ Exports */

export const SECOND_MS = 1000;
export const MINUTE_MS = 60 * SECOND_MS;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;
export const WEEK_MS = 7 * DAY_MS;

export const TIME_2020_01_01 = 1577836800000; // 2020-01-01T00:00:00.000Z
export const TIME_2100_01_01 = 4102444800000; // 2100-01-01T00:00:00.000Z

// -------------------------------------------------------------------- Function

/**
 * Returns a server synchronized time stamp like `Date.now()`
 * - Returns number of milliseconds since the UNIX EPOCH (1-1-1970),
 * - The method `setServerTime` can be used to synchronize the time
 *
 * @return {number} server synchronized timestamp
 */
export function getSynchedTime()
{
  const now = Date.now();

  if( _aheadOfReferenceTimeMs )
  {
    return now - _aheadOfReferenceTimeMs;
  }

  return now;
}

// -------------------------------------------------------------------- Function

/**
 * Set reference time
 * - The reference time is used when using the `getSynchedTime`
 * - The reference time can be e.g. a time stamp fetched from a server
 *
 * @param {number} referenceTimeMs - Time on the server
 */
export function setReferenceTime( referenceTimeMs )
{
  expectPositiveNumber( referenceTimeMs,
    "Missing or invalid parameter [referenceTimeMs]" );

  _aheadOfReferenceTimeMs = Date.now() - referenceTimeMs;
}

// -------------------------------------------------------------------- Function

/**
 * Returns a promise that resolves after a specified timeout
 * - If the returned promise is rejected, the timeout is cancelled
 *
 * @param  {number} delayOrMinDelayMs
 *   Number of milliseconds to wait before promise resolves
 *
 * @param  {number} [maxDelayMs=delayOrMinDelayMs]
 *   Maximum number of milliseconds to wait before the returned promise
 *   resolves. If this parameter is set, the delay will be chosen randomly
 *   between the values [delayOrMinDelayMs, maxDelayMs]
 *
 * @returns {Promise} promise that resolves after a specified timeout
 */
export function delay( delayOrMinDelayMs, maxDelayMs )
{
  if( typeof delayOrMinDelayMs !== "number" )
  {
    throw new Error("Invalid or missing parameter [delayOrMinDelayMs]");
  }

  if( maxDelayMs )
  {
    //
    // maxDelayMs was set -> generate random delay
    //
    if( maxDelayMs > delayOrMinDelayMs )
    {
      delayOrMinDelayMs =
        Math.floor(
          delayOrMinDelayMs +
          Math.random() * (maxDelayMs-delayOrMinDelayMs) );
    }
  }

  const promise = new HkPromise();

  let timer =
    setTimeout( () =>
      {
        timer = null;
        promise.resolve();
      },
      delayOrMinDelayMs );

  // Register catch method to cancel timer when promise is rejected
  promise.catch( () =>
    {
      if( timer )
      {
        clearTimeout( timer );
        timer = null;
      }
    } );

  return promise;
}

// -------------------------------------------------------------------- Function

/**
 * Get the number of milliseconds since the specified time stamp of the default
 * reference time stamp TIME_2020_01_01
 *
 * @param {number} [sinceMs=TIME_2020_01_01]
 *
 * @returns {number} number of milliseconds since the specified time
 */
export function sinceMs( sinceMs=TIME_2020_01_01 )
{
  return Date.now() - sinceMs;
}

// -------------------------------------------------------------------- Function

/**
 * Get a string that represents the time in a readable
 * string format: [DD:][HH:]MM:SS.mmm
 *
 * @param {number} timeMs [description]
 *
 * @returns {string} time in human readable format
 */
export function timeToString( timeMs )
{
  const days = Math.floor( timeMs / DAY_MS );

  let restMs = timeMs - days * DAY_MS;

  const hours = Math.floor( restMs / HOUR_MS );

  restMs = restMs - hours * HOUR_MS;

  const minutes = Math.floor( restMs / MINUTE_MS );

  restMs = restMs - minutes * MINUTE_MS;

  const seconds = Math.floor( restMs / SECOND_MS );

  restMs = restMs - seconds * SECOND_MS;

  let str = "";

  if( days )
  {
    str += `${days.toString().padStart( 2, "0")}:`;
    str += `${hours.toString().padStart( 2, "0")}:`;
  }
  else if( hours )
  {
    str += `${hours.toString().padStart( 2, "0")}:`;
  }

  str += `${minutes.toString().padStart( 2, "0")}:`;
  str += `${seconds.toString().padStart( 2, "0")}.`;
  str += `${restMs.toString().padEnd( 3, "0" )}`;

  return str;
}

