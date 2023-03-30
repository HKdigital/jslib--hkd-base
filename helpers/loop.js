
/* ------------------------------------------------------------------ Imports */

import { expectPositiveNumber,
         expectFunction }
  from "@hkd-base/helpers/expect.js";

import { delay }
  from "@hkd-base/helpers/time.js";

// -- Logging

import { getModuleLogger }
  from "@hkd-base/helpers/log.js";

const log = getModuleLogger( "loop.js" );

/* ------------------------------------------------------------------ Exports */

/**
 * Creates a loop function
 * - The function `loopFn` will be called after every loop
 * - The first execution will happen immediately
 *
 * @param {function} _.onLoopEnd
 * @param {number} [_.intervalMs=1000]
 * @param {number} [_.errorDelayMs=5000]
 *   Number of milliseconds of extra delay if the function throws an exception
 *
 * @returns {function} stopFunction
 *   When called, the loop will stop. No more functions will be called
 */
export function loop( { loopFn, intervalMs=1000, errorDelayMs=5000 }={} )
{
  expectFunction( loopFn,
    "Missing or invalid parameter [loopFn]" );

  expectPositiveNumber( intervalMs,
    "Missing or invalid parameter [intervalMs]" );

  expectPositiveNumber( errorDelayMs,
    "Missing or invalid parameter [errorDelayMs]" );

  let timer;

  async function loop()
  {
    if( !timer )
    {
      // Timer has been cleared
      return;
    }

    try {
      //
      // Execute the supplied loop function
      //
      await loopFn();

    }
    catch( e )
    {
      const error =
        new Error( "Exception in loop function", { cause: e } );

      log.error( error );

      //
      // The loop function threw an exception
      // => wait before starting next loop
      //
      await delay( errorDelayMs );
    }

    //
    // Set timer for next loop iteration
    //
    timer = setTimeout( loop, intervalMs );
  }

  //
  // Start loop
  //
  timer = setTimeout( loop, 0 );

  // -- Return stop function

  return () => {
    if( timer )
    {
      clearTimeout( timer );
      timer = null;
    }
  };
}
