
/* ------------------------------------------------------------------ Imports */

import { expectNotEmptyString,
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
   * @param {string} [label]
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

    if( label )
    {
      expectNotEmptyString( label,
        "Missing or invalid parameter [label]" );
    }
    else {
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

    this._offs[ label ] = offs;
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