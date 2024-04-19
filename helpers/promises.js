/**
 * promises.js
 *
 * @description
 * This file contains code that makes working with promises more comfortable
 *
 * @example
 *
 *   import { newResolvedHkPromise } from "./promises.js";
 *
 *   const promise = new newResolvedHkPromise();
 *   ...
 */

/* ------------------------------------------------------------------ Imports */

import { expectString,
         expectArray,
         expectObject,
         expectFunction }
  from '@hkd-base/helpers/expect.js';

import HkPromise
  from '@hkd-base/classes/HkPromise.js';

/* ---------------------------------------------------------------- Internals */

/* ------------------------------------------------------------------ Exports */

export { HkPromise };

// ---------------------------------------------------------------------- Method

/**
 * Get a resolved HkPromise
 *
 * @note
 *   A built-in static method also exists: Promise.resolve,
 *   this method returns a standard Promise
 *
 * @params {*} - Optional value to be resolved by the promise
 *
 * @return {HkPromise} Resolved HkPromise
 */
export function newResolvedHkPromise()
{
  const promise = new HkPromise();

  promise.resolve( ...arguments );

  return promise;
}

// ---------------------------------------------------------------------- Method

/**
 * Get a rejected HkPromise
 *
 * @note
 *   A built-in static method also exists: Promise.reject,
 *   this method returns a standard Promise
 *
 * @params {*} - Optional value to be rejected by the promise
 *
 * @return {HkPromise} Resolved HkPromise
 */
export function newRejectedHkPromise()
{
  const promise = new HkPromise();

  promise.reject( ...arguments );

  return promise;
}

// ---------------------------------------------------------------------- Method

/**
 * Convert a nodeJS style callback function with "error" and "data" arguments
 * to a promise base function.
 *
 * - This method accepts a single function as argument or an
 *   object and a method
 *
 * @param {function|object} functionOrObject
 *   Function to convert or object that contains the method to convert
 *
 * @param {function} [method] - The method to convert
 *
 * @returns {Promise} promise that returns the data that was passed to the
 *   callback function
 */
export function promisify( /* function OR object, methodName */ )
{
  let f;

  let methodName = undefined;

  switch( arguments.length )
  {
    case 1:
      f = arguments[0];
      expectFunction( f, 'Invalid parameter [functionOrObject]' );
      break;

    case 2:
      {
        const obj = arguments[0];
        methodName = arguments[1];

        expectObject( obj, 'Invalid parameter [functionOrObject]' );
        expectString( methodName, 'Invalid parameter [methodName]' );

        f = obj[ methodName ].bind( obj );
      }
      break;
    default:
      throw new Error('Invalid number of arguments (expected one of two)');
  }

  function promisified( ...args )
  {
    const promise = new HkPromise();

    /**
     * Interception callback function
     *
     * @param {object|null} err - Error object or null if no error occurred
     * @param {data} data - Results passed to the callback
     */
    function callback( err, ...args )
    {
      if( err )
      {
        promise.tryReject( err );
      }
      else {
        switch( args.length )
        {
          case 0:
            promise.tryResolve();
            break;

          case 1:
            promise.tryResolve( args[0] );
            break;

          default:
            promise.tryResolve( args );
            break;
        }
      }
    }

    args.push( callback );

    f.call( this, ...args );

    return promise;
  }

  promisified.methodName = methodName || f.name;

  return promisified;
}

// ---------------------------------------------------------------------- Method

/**
 * Execute a list of supplied functions in order
 *
 * @param {function[]} fns - Functions that should be chained
 * @param {array} [args] - Arguments to pass to all chained functions
 */
export async function async( fns, args )
{
  expectArray( fns, 'Missing or invalid parameter [fns]' );

  if( args )
  {
    expectArray( args, 'Missing or invalid parameter [args]' );
  }

  for( const fn of fns )
  {
    expectFunction( fn,
      'Invalid parameter [fns] (expected list of functions)' );

    if( args )
    {
      await fn();
    }
    else {
      await fn( ...args );
    }
  }
}
