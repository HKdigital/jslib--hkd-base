
/* ------------------------------------------------------------------ Imports */

import { expectObject,
         expectObjectOrNull } from "@hkd-base/helpers/expect.js";

import { InternalEventOrLogError } from "@hkd-base/types/error-types.js";

import ValueStore from "@hkd-base/classes/ValueStore.js";

import { ArgumentsArray } from "@hkd-base/types/array-types.js";

// import { getTwoChar10ms } from "@hkd-base/helpers/unique.js";

import { DEBUG, INFO, WARNING, ERROR } from "@hkd-base/types/log-types.js";

import LogEvent from "@hkd-base/classes/LogEvent.js";

/* ---------------------------------------------------------------- Internals */

const isNodeJs = (typeof process !== "undefined" && process.env);

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

    // this.sequenceId = 1;
    // this.meta = { boot: getTwoChar10ms() };

    // Object.defineProperty(
    //   this, "meta",
    //     {
    //       value: { boot: getTwoChar10ms() },
    //       enumerable: false
    //     } );

  }

  // -------------------------------------------------------------------- Method

  /**
   * Register another LogStream instance that will receive all
   */
  sendTo( logStream )
  {
    if( !(logStream instanceof LogStream) )
    {
      throw new Error("Missing or invalid parameter [logStream]");
    }

    return this.subscribe( ( logEvent ) =>
      {
        if( !logEvent )
        {
          // Somehow wrong data hase been set in the stream
          return;
        }

        expectObject( logEvent, "Invalid parameter [logEvent]" );

        // console.log( "sendTo", logEvent );

        //
        // Set raw value, skip higher level methods debug, info, ...
        //
        logStream.set( logEvent );
      },
      /* callOnRegistration */ false );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Sets `informative event data` in the log stream
   *
   * @param {...*} data
   */
  info( /* ...data */ )
  {
    const logEvent = this._toLogEvent( INFO, arguments );

    this.set( logEvent );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Sets `debug event data` in the log stream
   *
   * @param {...*} data
   */
  debug( /* ...data */ )
  {
    const logEvent = this._toLogEvent( DEBUG, arguments );

    // console.log("***DEBUG", logEvent);

    this.set( logEvent );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Sets `warning event data` in the log stream
   *
   * @param {...*} data
   */
  warning( /* ...data */ )
  {
    const logEvent = this._toLogEvent( WARNING, arguments );

    this.set( logEvent );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Sets `warning event data` in the log stream
   *
   * @param {...*} data
   */
  error( /* ...data */ )
  {
    const logEvent = this._toLogEvent( ERROR, arguments );

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
   * @param {object|string} args
   *
   * @throws InternalEventOrLogError
   */
  _toLogEvent( type, args )
  {
    let data;

    switch( args.length )
    {
      case 1:
        data = args[0];
        break;

      case 0:
        data = "(empty)";
        // throw new Error("Expected at least one argument");
        break;

      default:
        data = new ArgumentsArray(...args);
        break;
    }

    if( 1 === args.length )
    {
      data = args[0];
    }

    let logEvent;

    let context = this.context;

    // console.log( "####_toLogEvent", messageOrLogEvent );

    try {
      if( undefined === data )
      {
        throw new Error("The data to log should not be undefined");
      }

      logEvent = new LogEvent( { type, context, data } );
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
  //       sequenceId: this.sequenceId++
  //     };

  //   if( this.context )
  //   {
  //     error._context = this.context;
  //   }

  //   this.set( error );

  //   return error;
  // }

} // end class

