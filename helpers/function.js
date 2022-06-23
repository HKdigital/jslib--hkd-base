/**
 * function.js
 *
 * @description
 * This file contains code for working with functions
 *
 * @example
 *
 *   import { once } from "./function.js";
 *
 *   const sayHelloOnce = once( () => { console.log("Hello"); } );
 *
 *   sayHelloOnce();
 *   sayHelloOnce();
 */

/* ------------------------------------------------------------------ Imports */

import { expectFunction } from "./expect.js";

/* ------------------------------------------------------------------ Exports */

/**
 * Wraps a function so that the callback function will be called only once
 *
 * @param {function} callback
 *
 * @returns {function} callback wrapped in `once` function
 */
export function once( callback )
{
  expectFunction( callback, "Missing or invalid parameter [callback]" );

  let ignore = false;

  return function()
    {
      if( !ignore )
      {
        ignore = true;
        callback( ...arguments );
      }
    };
}

// -----------------------------------------------------------------------------

/**
 * Returns a debounced function
 * - The original function is not called more than once during the
 *   specified interval
 *
 * @param {function} fn
 * @param {number} [intervalMs=100]
 *
 * @returns {function} debounced function
 */
export function debounce( fn, intervalMs=200 )
{
  let idleTimer;
  let lastArguments;

  // console.log("debounce");

  return function debounced()
    {
      // console.log("debounced");

      if( idleTimer )
      {
        // console.log("idleTimer running");

        // The function has been called recently
        lastArguments = arguments;
        return;
      }

      idleTimer = setTimeout( () =>
        {
          // console.log("idleTimer finished", lastArguments);

          idleTimer = null;

          if( lastArguments )
          {
            //
            // At least one call has been "debounced"
            // -> make call with last arguments, so function always receives
            //    the arguments of the last call to the function
            //
            fn( ...lastArguments );
            lastArguments = undefined;
          }
        },
        intervalMs );

      fn( ...arguments );
    };
}