/**
 * time.js
 *
 * @description
 * This file contains time related functionality
 *
 * @example
 *
 *   import { delay, now } from '$hk/time.js';
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

import { expectPositiveNumber } from "$hk/expect.js";
import { HkPromise } from "$hk/promises.js";

/* ---------------------------------------------------------------- Internals */

let _aheadOfReferenceTimeMs = 0;

/* ------------------------------------------------------------------ Exports */

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