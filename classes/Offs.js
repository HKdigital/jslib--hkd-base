
/* ------------------------------------------------------------------ Imports */

import { expectNotEmptyString,
         expectNumber,
         expectFunction } from "@hkd-base/helpers/expect.js";

/* ------------------------------------------------------------- Export class */

export default class Offs
{
  _offs = {};

  /**
   * Construct an Offs instance
   *
   */
  constructor() {}

  // ---------------------------------------------------------------------------

  /**
   * Register an unsubscribe function
   *
   * @param {string|symbol} [label]
   * @param {function} unsubscribeFn
   */
  register( /* [label], unsubscribeFn */ )
  {
    let label;
    let unsubscribeFn;

    switch( arguments.length )
    {
      case 2:
        label = arguments[0];
        unsubscribeFn = arguments[1];
        break;

      case 1:
        unsubscribeFn = arguments[0];
        break;

      default:
        throw new Error("Invalid number of arguments");
    }

    if( label && typeof label !== "symbol" )
    {
      expectNotEmptyString( label,
        "Missing or invalid parameter [label]" );
    }
    else if( !label ) {
      label = Symbol();
    }

    expectFunction( unsubscribeFn,
      "Missing or invalid parameter [unsubscribeFn]" );

    const offs = this._offs;

    if( label in offs )
    {
      throw new Error(
        `A function with [label=${label}] has already been registered`);
    }

    this._offs[ label ] = unsubscribeFn;
  }

  // ---------------------------------------------------------------------------

  /**
   * Execute a function after the specified delay and register a cancel
   * function so that the delayed execution can be cancelled when unsubscribed
   *
   * @param {string} [label]
   * @param {function} [callback]
   * @param {number} [delayMs]
   *
   * @returns {function} unsubscribe
   */
  executeDelayed( /* [label], callback, delayMs */ )
  {
    let label;
    let callback;
    let delayMs;

    switch( arguments.length )
    {
      case 3:
        label = arguments[0];
        callback = arguments[1];
        delayMs = arguments[2];
        break;

      case 2:
        callback = arguments[0];
        delayMs = arguments[1];
        break;

      default:
        throw new Error("Invalid number of arguments");
    }

    if( label )
    {
      expectNotEmptyString( label,
        "Missing or invalid parameter [label]" );
    }
    else {
      label = Symbol();
    }

    expectFunction( callback,
      "Missing or invalid parameter [callback]" );

    expectNumber( delayMs,
      "Missing or invalid parameter [delayMs]" );

    const timer = setTimeout( callback, delayMs );

    const unsubscribeFn = () =>
      {
        clearTimeout( timer );
      };

    this.register( label, unsubscribeFn );

    return () => {
      delete this._offs[ label ];
      unsubscribeFn();
    };
  }

  // ---------------------------------------------------------------------------

  /**
   * Unregister a subscriber that has been defined with a label
   *
   * @param {string} [label]
   */
  tryUnregister( label )
  {
    expectNotEmptyString( label,
      "Missing or invalid parameter [label]" );

    const fn = this._offs[ label ];

    if( !fn )
    {
      // Nothing to do
      return;
    }

    delete this._offs[ label ];
    fn();
  }

  // ---------------------------------------------------------------------------

  /**
   * Call all registered unsubscribe functions
   */
  async unsubscribeAll()
  {
    const offs = this._offs;

    for( const key in offs )
    {
      await offs[ key ]();
    }
  }

  /* ------------------------------------------------------- Internal methods */


} // end class