/**
 * exceptions.js
 *
 * @description
 * This file contains code that can be used for exception handling
 *
 * @example
 *
 * import { throw } from "./exceptions.js";
 *
 * raise( "Something went wrong!" )
 */

/* ------------------------------------------------------------------ Imports */

import { isObject } from "@hkd-base/helpers/is.js";
import { systemLog } from "@hkd-base/helpers/log.js";

/* ---------------------------------------------------------------- Internals */

const EXIT_CODE_FATAL = 1;

/* ------------------------------------------------------------------ Exports */

/**
 * Throw an exception
 * - Allows adding custom attributes
 * - Sets the originating Error as Error property `cause`
 *
 * @param {string} message - Error message text
 *
 * @param {object} [attibutes] - Additional error attributes
 *
 * @param {Error} [cause]
 *   An Error instance that caused the new exception to be thrown
 */
export function raise( message, /* attributes, cause */ )
{
  let exception;

  if( typeof message !== "string" || !message )
  {
    throw new Error("Missing or invalid parameter [message]");
  }

  switch( arguments.length )
  {
    case 1:
      {
        //
        // Only parameter `message` has been supplied
        //

        // No attributes or original exception -> throw new Error
        throw new Error( message );
      }

    case 2:
    {
      const attributesOrCause = arguments[1];

      if( attributesOrCause instanceof Error )
      {
        //
        // Parameters `message` and `cause` have been supplied
        //
        const cause = attributesOrCause;

        throw new Error( message, { cause } );
      }
      else {
        //
        // Parameters `message` and `attributes` have been supplied
        //
        exception = new Error( message );

        exception.attributes = attributesOrCause;
      }

      throw exception;
    }

    case 3:
    {
      //
      // Parameters `errorText`, `attributes` and `cause` have been supplied
      //
      const attributes = arguments[1];
      const cause = arguments[2];

      if( !(attributes instanceof Object) )
      {
        throw new Error(
          "Invalid value for parameter [attributes] (expected object)",
          { cause: new Error( message ) } );
      }

      if( !(exception instanceof Error) )
      {
        throw new Error(
          "Invalid value for parameter [exception] (expected Error)",
          { cause: new Error( message ) } );
      }

      exception = new Error( message, { cause } );

      exception.attributes = attributes;

      throw exception;
    }
  } // end switch

  throw new Error(
    "Too many parameters supplied", { cause: new Error( message ) } );
}

// -----------------------------------------------------------------------------

/**
 * Creates a new Error from the error message and throws it with a reference
 * to the originating Error
 * - The originating Error is set as `cause` property
 *
 * @param {string} [message] - Additional message to prepend
 * @param {Error} error - Original error
 *
 * @throws {Error}
 */
export function rethrow( message, error )
{
  if( !(error instanceof Error) )
  {
    throw new Error(`Invalid parameter [error] (expected Error)`);
  }

  throw new Error( message, { cause: error } );
}

// -----------------------------------------------------------------------------

/**
 * Catches all uncaught exceptions and unhandled promise rejections
 * and creates events in the systemLog stream
 *
 * @param {boolean} [exitProcess=true]
 */
export function catchUncaughtExceptions( exitProcess=true )
{
  // TODO: return unsubscribe function (removeEventListener)
  // TODO: prevent subscribing more than once

  if( typeof process !== "undefined" )
  {
    /**
     * Register listeners to catch uncaught errors and unhandled exceptions in
     * a NodeJS environment
     */

    /* eslint-disable no-undef */

    if( typeof process.on === "function" )
    {
      process.on('uncaughtException',
        // eslint-disable-next-line no-unused-vars
        function handleUnCaughtException(error, origin)
          {
            //
            // @note origin = 'uncaughtException' or 'unhandledRejection'
            //

            try {
              systemLog
                .error( new Error( "Uncaught exception", { cause: error } ) );
            }
            catch( e )
            {
              console.log( "Failed to log uncaught exception" );
              console.log( e );

              console.log( "Original error" );
              console.log( err );
            }

            systemLog.error( error );

            if( exitProcess )
            {
              //
              // The system encounted a fatal exception, exit immediately
              //
              process.exit( EXIT_CODE_FATAL );
            }
          } );
    }
  }

  if( typeof window !== "undefined" )
  {
    /**
     * Register listeners to catch uncaught errors and unhandled exceptions in
     * a browser environment
     */

    /* eslint-disable no-undef */
    if( typeof window.addEventListener === "function" )
    {
      window.addEventListener("error", ( errorEvent ) =>
        {
          // function windowError(message, url, line)
          // {
          //   console.log( message, url, line );
          // }

          //console.log( 123, errorEvent );

          systemLog.error( errorEvent.error );

          // console.log('Uncaught exception:', errorEvent );

          errorEvent.stopPropagation();

          return false;
        } );

      window.addEventListener("unhandledrejection",
        function( promiseRejectionEvent )
        {

          // FIXME: send to systemLog!!!

          const { reason } = promiseRejectionEvent;

          console.log( reason );

          // reason.message?

          if( reason.cause )
          {
            console.log( reason.cause );
          }
        } );
    }

  }
}

// -----------------------------------------------------------------------------

/**
 * Instance that contains the properties of an Error object
 * - Only default and direct properties are copied
 * - The `cause` property is ignored
 * - The `stack` property is ignored
 *
 * @param {Error} error
 *
 * @returns {object} properties
 */
// export class ErrorProperties
// {
//   constructor( error )
//   {
//     if( !(error instanceof Error) )
//     {
//       throw new Error("Missing or invalid parameter [error]");
//     }

//     // Copy direct object properties

//     for( const key in error )
//     {
//       this[ key ] = error[ key ];
//     }

//     // Copy default properties (that were skipped by the for loop)

//     this.name = error.name;
//     this.message = error.message;

//     // @see https://developer.mozilla.org/
//     //      en-US/docs/Web/JavaScript/Reference/Global_Objects/Error

//     if( error.fileName )
//     {
//       this.fileName = error.fileName;
//     }

//     if( error.lineNumber )
//     {
//       this.lineNumber = error.lineNumber;
//     }

//     if( error.columnNumber )
//     {
//       this.columnNumber = error.columnNumber;
//     }

//     // if( error.stack )
//     // {
//     //   this.columnNumber = error.stack;
//     // }

//     // if( error.cause )
//     // {
//     //   this.columnNumber = error.cause;
//     // }
//   }
// }

// ----

// function errorData( error )
// {
//   if( !(error instanceof Error) )
//   {
//     throw new Error(`Invalid parameter [error] (expected Error)`);
//   }

//   const out = {};

//   // Copy direct object properties

//   for( const key in error )
//   {
//     out[ key ] = error[ key ];
//   }

//   // Copy default properties (that were skipped by the for loop)

//   out.name = error.name;
//   out.message = error.message;

//   // @see https://developer.mozilla.org/
//   //      en-US/docs/Web/JavaScript/Reference/Global_Objects/Error

//   if( error.fileName )
//   {
//     out.fileName = error.fileName;
//   }

//   if( error.lineNumber )
//   {
//     out.lineNumber = error.lineNumber;
//   }

//   if( error.columnNumber )
//   {
//     out.columnNumber = error.columnNumber;
//   }

//   // if( error.stack )
//   // {
//   //   this.columnNumber = error.stack;
//   // }

//   // if( error.cause )
//   // {
//   //   this.columnNumber = error.cause;
//   // }

//   return out;
// }

// -----------------------------------------------------------------------------

/**
 * Converts an Error to an array
 * - The first item of the array contains the properties of the supplied error
 * - The following items in the array contain the properties of the errors
 *   that caused the error. Causing errors are token from the `cause` property
 *   of the Errors.
 *
 * @param {Error} error
 *
 * @returns {object} array that contains objects with properties of the error
 *   and the errors that caused the error (if any).
 */
// export function errorToPropertiesArray( error )
// {
//   if( !(error instanceof Error) )
//   {
//     throw new Error(`Invalid parameter [error] (expected Error)`);
//   }

//   const output = [];

//   output.push( new ErrorProperties( error ) );

//   let cause = error.cause;

//   while( cause )
//   {
//     output.push( new ErrorProperties( cause ) );

//     cause = cause.cause;
//   }

//   return output;
// }

// -----------------------------------------------------------------------------

/**
 * Creates an EventError instance from an ErrorEvent instance
 * - An EventError is an Error
 * - An ErrorEvent is an Event
 *
 * @param {ErrorEvent} errorEvent
 *
 * @returns {EventError} error
 */
// export function toEventError( errorEvent )
// {
//   if( !(errorEvent instanceof ErrorEvent) )
//   {
//     throw new Error("Invalid parameter [errorEvent] (expected ErrorEvent)");
//   }

//   console.log( 456, errorEvent );

//   const error = new EventError( errorEvent.message );

//   if( errorEvent.fileName )
//   {
//     error.fileName = errorEvent.fileName;
//   }

//   if( errorEvent.lineNumber )
//   {
//     error.lineNumber = errorEvent.lineNumber;
//   }

//   return error;
// }

// -----------------------------------------------------------------------------

/**
 * Converts the cause property that may contain a chain of errors to an array
 *
 * @param {Error} error
 *
 * @returns {object} list of errors that caused the error (if any)
 */
export function errorCauseToArray( error )
{
  if( !isObject( error ) )
  {
    throw new Error(`Invalid parameter [error] (expected object)`);
  }

  const out = [];

  let cause = error.cause;

  while( cause )
  {

    out.push( cause );

    cause = cause.cause;
  }

  return out;
}

// -----------------------------------------------------------------------------

/**
 * Get a program stack(trace) for the current execution point
 *
 * @param {number} [skipFirst=3]
 *   Number of entries to skip from the beginning of the returned stack
 *
 * @param {number} [skipLast=1]
 *   Number of entries to skip from the end of the returned stack
 *
 * @returns {object[]} stack(trace)
 */
export function getStack( skipFirst=3, skipLast=0 )
{
  // let orig = Error.prepareStackTrace;

  // eslint-disable-next-line no-unused-vars
  Error.prepareStackTrace = function( _, stack )
    {
      return stack;
    };

  let err = new Error();

  // Error.captureStackTrace( err );

  let stack = err.stack;

  let j = skipFirst;
  let n = stack.length - skipLast;

  const result = [];

  for( ; j < n; j = j + 1 )
  {
    const CallSite = stack[j];

    result.push(
      {
        lineNumber: CallSite.getLineNumber(),
        fileName: CallSite.getFileName()
      } );
  }

  return result;

  // -> stack of formatted strings

  // const myError = {};

  // Error.captureStackTrace( myError );

  // return myError.stack;


  // return stack.slice( skipFirst, -skipLast );

  // Error.prepareStackTrace = orig;

  // if( !sourceMapConsumer )
  // {
  //   return stack;
  // }

  // const sourceMappedStack = [];

  // let j = skipFirst;
  // let n = stack.length - skipLast;

  // for( ; j < n; j = j + 1 )
  // {
  //   const CallSite = stack[j];

  //   const item = new SourceMappedCallSite( sourceMapConsumer, CallSite );

  //   sourceMappedStack.push( item );
  // }

  // return sourceMappedStack;
}
