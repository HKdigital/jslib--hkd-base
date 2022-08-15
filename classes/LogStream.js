
/* ------------------------------------------------------------------ Imports */

import { expectObjectOrNull } from "@hkd-base/helpers/expect.js";

import { isObject } from "@hkd-base/helpers/is.js";

import { InternalEventOrLogError } from "@hkd-base/types/error-types.js";

import ValueStore from "@hkd-base/classes/ValueStore.js";

import { getTwoChar10ms } from "@hkd-base/helpers/unique.js";

import { DEBUG, INFO, WARNING, ERROR } from "@hkd-base/types/log-types.js";

import LogEvent from "@hkd-base/classes/LogEvent.js";

/* ---------------------------------------------------------------- Internals */

const INTERNAL_LOG_OR_EVENT_ERROR = "internal-log-or-event-error";

/* ------------------------------------------------------------- Export class */

export { INTERNAL_LOG_OR_EVENT_ERROR };

/**
 * LogStream
 * - Class that can be used for..

 */
export default class LogStream extends ValueStore
{
  /**
   * Constructor
   *
   * @param {object} [context] - Context of the events logged via this stream
   */
  constructor( context=null )
  {
    super();

    expectObjectOrNull( context,
      "Invalid value for parameter [context]" );

    Object.defineProperty(
      this, "context",
      {
        value: context ? { ...context } : null,
        enumerable: false
      } );

    this.count = 1;
    this.meta = { boot: getTwoChar10ms() };

    Object.defineProperty(
      this, "meta",
        {
          value: { boot: getTwoChar10ms() },
          enumerable: false
        } );

  }

  // -------------------------------------------------------------------- Method

  /**
   * Sets `informative event data` in the log stream
   *
   * @param {object|string} messageOrLogEvent
   */
  info( messageOrLogEvent )
  {
    const logEvent = this._normalizeLogEvent( INFO, messageOrLogEvent );

    this.set( logEvent );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Sets `debug event data` in the log stream
   *
   * @param {object|string} messageOrLogEvent
   */
  debug( messageOrLogEvent )
  {
    const logEvent = this._normalizeLogEvent( DEBUG, messageOrLogEvent );

    this.set( logEvent );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Sets `warning event data` in the log stream
   *
   * @param {object|string} messageOrLogEvent
   */
  warning( messageOrLogEvent )
  {
    const logEvent = this._normalizeLogEvent( WARNING, messageOrLogEvent );

    this.set( logEvent );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Sets `warning event data` in the log stream
   *
   * @param {object|string} messageOrLogEvent
   */
  error( messageOrLogEvent )
  {
    const logEvent = this._normalizeLogEvent( ERROR, messageOrLogEvent );

    this.set( logEvent );
  }

  /* ------------------------------------------------------- Internal methods */

  /**
   * Converts event data to a standard format
   * - Checks if the supplied `logEvent` is valid
   *
   * If the event data is invalid, this method:
   * - Sets an internal error in the log stream
   * - Throws an Error
   *
   * @param {string} type
   * @param {object|string} messageOrLogEvent
   *
   * @throws InternalEventOrLogError
   */
  _normalizeLogEvent( type, messageOrLogEvent )
  {
    let logEvent;

    const context = this.context;

    try {
      logEvent = new LogEvent( { type, context, data: messageOrLogEvent } );
    }
    catch( e )
    {
      const error =
        new InternalEventOrLogError(
          "Failed to construct LogEvent instance", { cause: e } );

      const logEvent =
        new LogEvent( { type: ERROR, context, data: error } );

      this.set( logEvent );
    }

    return logEvent;
  }

  // -------------------------------------------------------------------- Method

  /**
   * Set an internal error in the log stream
   * - Creates a new Error if only an error message was supplied
   * - An internal error may a.o. be caused by a programming error or
   *   an internal resource that failed
   *
   * @param {string|Error|*} errorOrErrorMessage
   *
   * @returns {InternalEventOrLogError}
   *   the internal Error that was set in the log stream
   */
  // _internalLogError( errorOrErrorMessage )
  // {
  //   let error;

  //   if( typeof errorOrErrorMessage === "string" )
  //   {
  //     error = new Error( errorOrErrorMessage );
  //   }
  //   else if( !(errorOrErrorMessage instanceof Error) )
  //   {
  //     if( isObject( errorOrErrorMessage) )
  //     {
  //       error = new InternalEventOrLogError("Internal error");
  //       error.details = errorOrErrorMessage;
  //     }
  //     else {
  //       error =
  //         new InternalEventOrLogError(
  //           "Invalid parameter [errorOrErrorMessage]");
  //     }
  //   }
  //   else {
  //     error = errorOrErrorMessage;
  //   }

  //   error._meta =
  //     {
  //       ...this.meta,
  //       type: INTERNAL_LOG_OR_EVENT_ERROR,
  //       count: this.count++
  //     };

  //   if( this.context )
  //   {
  //     error._context = this.context;
  //   }

  //   this.set( error );

  //   return error;
  // }

} // end class

