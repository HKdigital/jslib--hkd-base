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

/* ------------------------------------------------------------------ Exports */

/**
 * Throw an exception
 * - Allows adding custom attributes
 * - Extends the original Error if supplied or creates a new one
 *
 * @param {string} errorText - Error message text
 *
 * @param {object} [attibutes] - Additional error attributes
 *
 * @param {Error} [exception]
 *   If not supplied, a new Error object will be created and thrown.
 *   If supplied, the original error instance will be enhanced with the
 *   supplied errorText and additional information
 */
export function raise( errorText, /* attributes, exception */ )
{
  let attributes;
  let exception;

  if( typeof errorText !== "string" || !errorText.length )
  {
    throw new Error("Invalid parameter [errorText]");
  }

  switch( arguments.length )
  {
    case 0:
      throw new Error( "Missing parameter [errorText]" );

    case 1:
      {
        //
        // Only parameter `errorText` has been supplied
        //

        // No attributes or original exception -> throw new Error
        throw new Error( errorText );
      }

    case 2:
    {
      //
      // Parameters `errorText` and `attributes` have been supplied
      //
      //   -- OR --
      //
      // Parameters `errorText` and `exception` have been supplied
      //

      const param2 = arguments[1];

      if( param2 instanceof Error )
      {
        exception = param2;

        //
        // Convert exception to an ExtendedError
        //
        exception = new ExtendedError( errorText, exception );
      }
      else {
        // Create exception (Error instance)
        exception = new Error( errorText );

        attributes = param2;
      }
      break;
    }
    case 3:
    {
      //
      // Parameters `errorText`, `attributes` and `exception` have been supplied
      //
      attributes = arguments[1];
      exception = arguments[2];

      if( !(attributes instanceof Object) )
      {
        throw new Error(
          "Invalid value for parameter [attributes] (expected object)");
      }

      if( !(exception instanceof Error) )
      {
        throw new Error(
          "Invalid value for parameter [exception] (expected Error)");
      }

      //
      // Convert exception to an ExtendedError
      //
      exception = new ExtendedError( errorText, exception );
      break;
    }
    default:
      throw new Error( "Too many parameters supplied" );
  }

  let historyItem = { errorText };

  if( attributes )
  {
    historyItem.attributes = attributes;
  }

  if( !exception.history )
  {
    exception.history = [ historyItem ];
  }
  else {
    exception.history.push( historyItem );
  }

  throw exception;
}

// -----------------------------------------------------------------------------

/**
 * Rethrow an existing error (usually caught in a try...catch block) with an
 * additional message prepended
 *
 * @param {string} [message] - Additional message to prepend
 * @param {Error} error - Original error
 *
 * @throws {Error}
 */
export function rethrow( message, error )
{
  // TODO: use raise internally

  if( !(error instanceof Error) )
  {
    throw new Error(`Invalid parameter [error] (expected Error)`);
  }

  // if( message )
  // {
  //   if( typeof message === "string" )
  //   {
  //     // Prefix the new message to the existing error message
  //     error.message = `${message}\n<- ${error.message}`;
  //   }
  //   else {
  //     throw new Error("Missing parameter [errorText] or [expectedText]");
  //   }
  // }

  // throw error;

  throw new ExtendedError( message, error );
}

// -----------------------------------------------------------------------------

// class ExtendedError extends Error {
//   constructor( message )
//   {
//     if( typeof message !== "string" || !message.length )
//     {
//       throw new Error("Missing of invalid parameter [message]");
//     }

//     super( message );

//     this.name = this.constructor.name;
//     this.message = message;

//     if( typeof Error.captureStackTrace === 'function' )
//     {
//       Error.captureStackTrace( this, this.constructor );
//     }
//     else {
//       this.stack = (new Error(message)).stack;
//     }
//   }
// }

// // -----------------------------------------------------------------------------

// export class RethrownError extends ExtendedError
// {
//   constructor( message, error )
//   {
//     if( typeof message !== "string" || !message.length )
//     {
//       throw new Error("Missing of invalid parameter [message]");
//     }

//     if( !(error instanceof Error) )
//     {
//       throw new Error(
//         "Invalid value for parameter [error] (expected Error)");
//     }

//     super( message );

//     // this.original = error;

//     this.new_stack = this.stack;

//     let message_lines =  (this.message.match(/\n/g)||[]).length + 1;

//     this.stack =
//       this.stack
//         .split('\n').slice( 0, message_lines + 1 )
//         .join('\n') + '\n' + error.stack;
//   }
// }

// -----------------------------------------------------------------------------

export class ExtendedError extends Error
{
  /**
   * Construct a new Error instance that
   * - This class can be used if an Error should be `stacked`:
   *   to create a new error, with a new error message, while keeping
   *   a reference to the error that caused the error to occur
   *
   * - A reference to the previous error instance will be stored
   *   as property `cause`
   *
   * @param {string} message
   * @param {Error} cause - Error that cause this error
   */
  constructor( message, cause=null )
  {
    super( message ); // super must be called

    // TODO: unique error id?

    this.name = "ExtendedError";

    //
    // @see https://developer.mozilla.org/
    //      en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause
    //
    this.cause = cause;
  }

  /**
   * Export error data
   *
   * TODO: export options
   */
  export()
  {
    return {
      message: this.message /* TODO: internal error, more details */
    };
  }
}

// -----------------------------------------------------------------------------

export { getStack } from "@platform/helpers/trace.js";


