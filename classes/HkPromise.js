/**
 * Hkpromise.js
 *
 * @description
 * HkPromise extends the default Promise class. A HkPromise offers some
 * additional methods, e.g. resolve, reject and setTimeout, which makes it
 * easier to use than the build in Promise class in some code constructions.
 *
 * @example
 *
 *   import HkPromise from "./HkPromise.js";
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
  expectFunction } from "../helpers/expect.js";

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

const doNothing = () => {};

/**
 * HkPromise extends the default javascript Promise class
 */
export default class HkPromise extends Promise
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
  // static async chain( fns, args )
  // {
  //   expectArray( fns, "Missing or invalid parameter [fns]" );

  //   if( args )
  //   {
  //     expectArray( args, "Missing or invalid parameter [args]" );
  //   }

  //   for( const fn of fns )
  //   {
  //     expectFunction( fn,
  //       "Invalid parameter [fns] (expected list of functions)" );

  //     if( args )
  //     {
  //       await fn();
  //     }
  //     else {
  //       await fn( ...args );
  //     }
  //   }
  // }

} // end class
