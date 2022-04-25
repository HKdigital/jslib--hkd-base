/**
 * flow.js
 *
 * @description
 * This file contains code for controlling data flows
 *
 * @example
 *
 *   import { once } from "./once.js";
 *
 *   const sayHelloOnce = once( () => { console.log("Hello"); } );
 *
 *   sayHelloOnce();
 *   sayHelloOnce();
 */

/* ------------------------------------------------------------------ Imports */

import { expectFunction } from "../expect.js";

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