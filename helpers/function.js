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

import { expectFunction } from "@hkd-base/helpers/expect.js";

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
 * @param {number} [intervalMs=200]
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

// -----------------------------------------------------------------------------

/**
 * Adds a wrapper around a function that only calls the supplied function
 * if the (first) supplied argument to the returned function is not `null`
 *
 * @param {object} [object]
 *   Optional function context to be used as `this`
 *
 * @param {function} functionOrMethodName
 *
 * @returns {function} not null wrapper function
 */
// export function ifNotNull( /* object, functionOrMethodName */ )
// {
//   let fn;

//   switch( arguments.length )
//   {
//     case 1:
//       fn = arguments[0];
//       expectFunction( fn, "Missing or invalid parameter [fn]" );
//       break;

//     case 2:
//       {
//         const object = arguments[0];
//         const methodName = arguments[1];

//         expectObject( object, "Invalid parameter [object]" );
//         expectNotEmptyString( methodName, "Invalid parameter [methodName]" );

//         fn = object[ methodName ].bind( object );

//         expectFunction( fn, `Invalid method [<object>.${methodName}]` );
//       }
//       break;

//     default:
//       throw new Error("Invalid number of arguments");
//   }

//   return async ( value ) => {
//     if( null !== value )
//     {
//       await fn( value );
//     }
//   };
// }