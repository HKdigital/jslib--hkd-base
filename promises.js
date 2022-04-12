/**
 * promises.js
 *
 * @description
 * This file contains code that makes working with promises more comfortable
 *
 * @example
 *
 *   import { HkPromise } from "./promises.js";
 *
 *   function() {
 *     const promise = new HkPromise();
 *
 *     setTimeout( promise.resolve, 1000 );
 *
 *     return promise;
 *   }
 */

/* ------------------------------------------------------------------ Imports */

import {
  expectString,
  expectNumber,
  expectArray,
  expectObject,
  expectFunction } from "$hk/expect.js";

/* ---------------------------------------------------------------- Internals */

const resolved$ = Symbol("resolved");
const rejected$ = Symbol("rejected");
const pending$ = Symbol("pending");

const timeout$ = Symbol("timeout");
const cancelled$ = Symbol("cancelled");

const resolveFn$ = Symbol("resolveFn");
const rejectFn$ = Symbol("rejectFn");

const timeoutTimer$ = Symbol("timeoutTimer");

const hasThen$ = Symbol("hasThen");

/* ------------------------------------------------------------------- Export */

export const doNothing = () => {};

/**
 * HkPromise extends the default javascript Promise class
 */
export class HkPromise extends Promise
{
  constructor( initFn )
  {
    let _resolveFn;
    let _rejectFn;

    super( ( resolveFn, rejectFn ) =>
      {
        //
        // @note if initFn cannot be called an exception will be thrown:
        // TypeError: Promise resolve or reject function is not callable
        //
        if( initFn )
        {
          initFn( resolveFn, rejectFn );
        }

        _resolveFn = resolveFn;
        _rejectFn = rejectFn;
      } );

    // @note some values are not initialized on purpose,
    //       to save time during promise creation

    this[ resolveFn$ ] = _resolveFn;
    this[ rejectFn$ ] = _rejectFn;

    // this[ resolved$ ] = false;
    // this[ rejected$ ] = false;

    this[ pending$ ] = true;

    // this[ cancelled$ ] = false;
    // this[ timeout$ ] = false;

    // this[ timeoutTimer$ ] = undefined;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get value of property [resolved]
   *
   * @returns {boolean} true if the promise has been resolved
   */
  get resolved()
  {
    return this[ resolved$ ] ? true : false;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get value of property [rejected]
   *
   * @returns {boolean} true if the promise was rejected
   */
  get rejected()
  {
    return this[ rejected$ ] ? true : false;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get value of property [pending]
   *
   * @returns {boolean} true if the promise is still pending
   */
  get pending()
  {
    return this[ pending$ ];
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get value of property [cancelled]
   *
   * @returns {boolean} true if the promise was cancelled
   */
  get cancelled()
  {
    return this[ cancelled$ ] ? true : false;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get value of property [timeout]
   *
   * @returns {boolean} true if the promise was cancelled due to a timeout
   */
  get timeout()
  {
    return this[ timeout$ ] ? true : false;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Resolve the promise
   *
   * @param {mixed} [value] - Value to pass to the "then" callbacks
   */
  resolve( /* value */ )
  {
    // -- Check current Promise state

    if( !this[ pending$ ] )
    {
      if( this[ resolved$ ] )
      {
        throw new Error(
          "Cannot resolve Promise. Promise has already resolved");
      }
      else {
        throw new Error(
          "Cannot resolve Promise. Promise has already been rejected");
      }
    }

    // -- Clear timeout timer (if any)

    if( undefined !== this[ timeoutTimer$ ] )
    {
      clearTimeout( this[ timeoutTimer$ ] );

      this[ timeoutTimer$ ] = undefined;
    }

    // -- Set flags and call resolve function

    this[ resolved$ ] = true;
    this[ pending$ ] = false;

    this[ resolveFn$ ]( ...arguments );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Resolve the promise if the promise is still pending
   *
   * @param {mixed} [value] - Value to pass to the "catch" callbacks
   */
  tryResolve( /* value */ )
  {
    if( this[ pending$ ] )
    {
      this.resolve( ...arguments );
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Reject the promise
   *
   * @param {Object} [errorOrInfo]
   *   Object to pass to the "catch" callbacks, usually an Error object
   */
  reject( /* errorOrInfo */ )
  {
    if( !this[ hasThen$ ] )
    {
      //
      // No then (or await) has been used
      // add catch to prevent useless unhandled promise rejection
      //
      this.catch( doNothing );
    }

    // -- Check current Promise state

    if( !this[ pending$ ] )
    {
      if( this[ resolved$ ] )
      {
        throw new Error(
          "Cannot reject Promise. Promise has already resolved");
      }
      else {
        throw new Error(
          "Cannot reject Promise. Promise has already been rejected");
      }
    }

    // -- Clear timeout timer (if any)

    if( undefined !== this[ timeoutTimer$ ] )
    {
      clearTimeout( this[ timeoutTimer$ ] );

      this[ timeoutTimer$ ] = undefined;
    }

    // -- Set flags and call reject function

    this[ rejected$ ] = true;
    this[ pending$ ] = false;

    this[ rejectFn$ ]( ...arguments );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Reject the promise if the promise is still pending
   *
   * @param {Object} [errorOrInfo]
   *   Object to pass to the "catch" callbacks, usually an Error object
   */
  tryReject( /* errorOrInfo */ )
  {
    if( this[ pending$ ] )
    {
      this.reject( ...arguments );
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Reject the promise and set this.cancelled=true
   *
   * @param {Object} [errorOrInfo]
   *   Object to pass to the "catch" callbacks, usually an Error object
   */
  cancel( errorOrInfo )
  {
    if( errorOrInfo )
    {
      if( !(errorOrInfo instanceof Object) )
      {
        throw new Error(
          "Invalid parameter [errorOrInfo] (expected (error) object");
      }
    }
    else {
      errorOrInfo = new Error("Cancelled");
    }

    errorOrInfo.cancelled = true;

    this[ cancelled$ ] = true;
    this.reject( ...arguments );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Reject the promise and set this.cancelled=true
   *
   * @param {Object} [errorOrInfo]
   *   Object to pass to the "catch" callbacks, usually an Error object
   */
  tryCancel( /*errorOrInfo*/ )
  {
    if( this[ pending$ ] )
    {
      this.cancel( ...arguments );
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Specify the number of milliseconds until the promise should time out.
   * - When a timeout occurs: the promise is cancelled and the following
   *   properties are both set
   *
   *      this.timeout=true
   *      this.cancelled=true
   *
   * @param {number} ms
   *   Number of milliseconds after which the promise should time out
   *
   * @param {string} [message="Timeout"]
   *   Message of the error that will be thrown when the timeout occurs
   */
  setTimeout( ms, message="Timeout" )
  {
    expectNumber( ms, "Missing or invalid parameter [ms]" );
    expectString( message, "Missing or invalid parameter [message]" );

    // -- Check current Promise state

    if( !this[ pending$ ] )
    {
      if( this[ resolved$ ] )
      {
        throw new Error(
          "Cannot set timeout. Promise has already resolved");
      }
      else {
        throw new Error(
          "Cannot set timeout. Promise has already been rejected");
      }
    }

    // -- Clear existing timeout (if any)

    if( undefined !== this[ timeoutTimer$ ] )
    {
      clearTimeout( this[ timeoutTimer$ ] );
    }

    // -- Set timeout

    const err = new Error( message );

    this[ timeoutTimer$ ] = setTimeout( () =>
    {
      if( !this[ pending$ ] )
      {
        // Promise has already been resolved (should not happen)
        return;
      }

      this[ timeout$ ] = true;
      this[ cancelled$ ] = true;


      err.timeout = true;
      err.cancelled = true;

      this.reject( err );
    },
    ms );

    // return this -> chainable method
    return this;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Register a callback that is called when the promise resolves
   *
   * @param {function} callback
   */
  then( /* callback */ )
  {
    this[ hasThen$ ] = true;

    return super.then( ...arguments );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Register a callback that is called when the promise rejects, is
   * cancelled or times out
   *
   * @param {function} callback
   */
  catch( /* callback */ )
  {
    return super.catch( ...arguments );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Execute a list of supplied functions in order
   *
   * @param {function[]} fns - Functions that should be chained
   * @param {array} [args] - Arguments to pass to all chained functions
   */
  static async chain( fns, args )
  {
    expectArray( fns, "Missing or invalid parameter [fns]" );

    if( args )
    {
      expectArray( args, "Missing or invalid parameter [args]" );
    }

    for( const fn of fns )
    {
      expectFunction( fn,
        "Invalid parameter [fns] (expected list of functions)" );

      if( args )
      {
        await fn();
      }
      else {
        await fn( ...args );
      }
    }
  }

} // end class

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
};

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
};

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
      expectFunction( f, "Invalid parameter [functionOrObject]" );
      break;

    case 2:
      {
        const obj = arguments[0];
        methodName = arguments[1];

        expectObject( obj, "Invalid parameter [functionOrObject]" );
        expectString( methodName, "Invalid parameter [methodName]" );

        f = obj[ methodName ].bind( obj );
      }
      break;
    default:
      throw new Error("Invalid number of arguments (expected one of two)");
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
};

