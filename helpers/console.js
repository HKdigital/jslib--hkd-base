/**
 * console.js
 *
 * @description
 * This file contains code that helps working with the console (bash like
 * terminals). E.g. for logging
 *
 * @example
 *
 * import { log } from "@hkd-base/helpers/console.js";
 *
 * log.debug( ... )
 */

/* ------------------------------------------------------------------ Imports */

import { expectObject } from "@hkd-base/helpers/expect.js";

import { errorCauseToArray } from "@hkd-base/helpers/exceptions.js";

import { DEBUG, INFO, WARNING, ERROR } from "@hkd-base/types/log-types.js";

import { getOutputStream,
         OUTPUT_LABEL_CONSOLE } from "@hkd-base/helpers/log.js";

import { ArgumentsArray } from "@hkd-base/types/array-types.js";

/* ---------------------------------------------------------------- Internals */

const MAX_HEADER_CONTENT_LENGTH = 47;

const CONSOLE_METHOD_LOG = "log";
const CONSOLE_METHOD_ERROR = "error";
const CONSOLE_METHOD_WARNING = "warn";

const CONSOLE_METHODS =
  {
    [DEBUG]: CONSOLE_METHOD_LOG,
    [INFO]: CONSOLE_METHOD_LOG,
    [WARNING]: CONSOLE_METHOD_WARNING,
    [ERROR]: CONSOLE_METHOD_ERROR
  };


// -----------------------------------------------------------------------------

export let unsubscribeConsoleLogging;

/**
 * Enable console logging
 * - Outputs log events from the systemLog stream to the console
 * - Enables catching uncaught exceptions
 */
export function enableConsoleLogging( eventLogPrinter=defaultEventLogPrinter )
{
  expectObject( eventLogPrinter,
    "Invalid parameter for property [eventLogPrinter]");

  if( unsubscribeConsoleLogging )
  {
    return;
  }

  unsubscribeConsoleLogging =
    getOutputStream( OUTPUT_LABEL_CONSOLE ).subscribe( eventLogPrinter );

  return unsubscribeConsoleLogging;
}

// -----------------------------------------------------------------------------

/**
 * Convert event type to a console method name that should be used for logging
 *
 * @param {string} type - LogEvent type
 *
 * @returns {string} console method name to be used for logging
 */
export function typeToConsoleMethod( type )
{
  return CONSOLE_METHODS[ type ] || CONSOLE_METHOD_LOG;
}

// -----------------------------------------------------------------------------

/**
 * Format a context object a key value pairs
 * - If context is null, an empty string is returned
 *
 * @param {object|null} context [description]
 *
 * @returns {string|null} formatted context (key value pairs)
 */
function formatContext( context )
{
  expectObject( context, "Missing or invalid parameter [context]" );

  let str = "";

  for( let key in context )
  {
    str += `,${key}=${JSON.stringify(context[key])}`;
  }

  if( str.length )
  {
    return `[${str.slice(1)}]`;
  }

  return "";
}

/* ------------------------------------------------------------------ Exports */

/**
 * Print logEvents to the browser console
 *
 * @param {object} logEvent
 */
export function defaultEventLogPrinter( logEvent )
{
  // console.log("@@@@print", logEvent);

  console.log(); // newline

  if( logEvent.data instanceof Error )
  {
    const error = logEvent.data;
    const context = logEvent.context;

    if( error.cause )
    {
      //
      // Create a group for an Error that contains a `cause`
      //
      const causes = errorCauseToArray( error );

      if( !context )
      {
        console.group( `Error: ${error.message}` );
      }
      else {
        console.group( `Error: ${error.message}`, formatContext( context ) );
      }

      console.error( error );

      for( const cause of causes )
      {
        console.error( cause );
        // if( cause instanceof ErrorEvent )
        // {
        //   console.error( cause.error,
        //     {
        //       fileName: cause.filename,
        //       lineNumber: cause.lineno,
        //       colno: cause.colno
        //     } );
        // }
        // else {
        //   console.error( cause );
        // }
      }

      console.groupEnd();
    }
  }
  else {
    //
    // logEvent does *not* contain an Error
    //
    let { header,
          parts } = getHeaderAndParts( logEvent );

    const methodName = typeToConsoleMethod( logEvent.type );

    if( header )
    {
      if( !parts.length )
      {
        console[ methodName ]( header );
      }
      else {
        console.group( header );

        for( const data of parts )
        {
          console[ methodName ]( data );
        }

        console.groupEnd();
      }
    }
    else {
      for( const data of parts )
      {
        console[ methodName ]( data );
      }
    }

    // console.log("parts", parts );

    // if( header )
    // {
    //   if( DEBUG === logEvent.type )
    //   {
    //     header = "(debug) " + header;
    //   }

    //   if( body )
    //   {
    //     console.log( header, body );
    //   }
    //   // else if( body === undefined )
    //   // {
    //   //   console.trace( header );
    //   // }
    //   else {
    //     console.log( header );
    //   }
    // }
    // else {
    //   //
    //   // Print message without header
    //   //
    //   if( body ) {

    //     if( !(body instanceof ArgumentsArray) )
    //     {
    //       console[ methodName ]( body );
    //     }
    //     else {
    //       //
    //       // data is ArgumentsArray => print multiple arguments
    //       //
    //       console[ methodName ]( ...body );
    //     }

    //   }
    //   else {
    //     console.log("(empty message)");
    //   }
    // }
  }
}

// -----------------------------------------------------------------------------

/**
 * Create header that contains meta information about the event
 * - Generates different headers when using the browser console or a terminal
 *
 * @param {object} logEvent
 * @param {string} message
 *
 * @returns {string} header
 */
function createMetaHeader( {sequenceId, /*type,*/ at, context} )
{
  let header;

  const isNodeJs = (typeof process !== "undefined" && process.env);

  if( isNodeJs )
  {
    // if( "development" === process.env.NODE_ENV )
    // {
    //
    // }

    const getSourceMappedStack = global.getSourceMappedStack;

    if( !getSourceMappedStack )
    {
      header = `#${sequenceId}`;
    }
    else {
      const stack = getSourceMappedStack();

      if( !stack.length )
      {
        header = `#${sequenceId}`;
      }
      else {
        const stack0 = stack[0];

        const fileName = stack0.getFileName();
        const lineNumber = stack0.getLineNumber();

        header = `#${sequenceId} ${fileName}:line ${lineNumber}`;
      }
    }
  }

  if( context )
  {
    if( context.className )
    {
      header += ` (${context.className})`;
    }
    else if( context.functionName )
    {
      header += ` (${context.functionName})`;
    }
  }

  //console.log( context );

  if( isNodeJs )
  {
    const d = new Date(at);

    header += ` at ${d.toISOString()}`;
  }

  return header;
}

// -----------------------------------------------------------------------------

/**
 * Create header and parts and the name of the log function to use
 *
 * --
 * @typedef {object} Part
 * @property {string} methodName
 * @property {*} data
 * --
 *
 * @param {object} logEvent
 *
 * @returns {string} { methodName: <string>, header: <string>, parts: <Part[]> }
 */
function getHeaderAndParts( logEvent )
{
  const type = logEvent.type;
  const methodName = typeToConsoleMethod( type );

  let data = logEvent.data;

  if( data instanceof Error )
  {
    throw new Error(
      "Invalid parameter [logEvent] " +
      "(eventLog.data should not be an Error object)");
  }

  let metaHeader = null;
  let header = null;
  let parts = [];

  switch( typeof data )
  {
    case "string":
      if( !data.length )
      {
        metaHeader = createMetaHeader( logEvent );
        header = `${metaHeader} (empty string)`;
      }
      else if( INFO === type )
      {
        //
        // We're outputting an info message
        //
        metaHeader = createMetaHeader( logEvent );
        header = `${metaHeader}`;
        parts.push( data );
      }
      else if( data.length < MAX_HEADER_CONTENT_LENGTH)
      {
        //
        // data is a short string
        //
        metaHeader = createMetaHeader( logEvent );
        header = `${metaHeader} ${data}`;
      }
      else {
        metaHeader = createMetaHeader( logEvent );

        header =
          `${metaHeader} ${data.slice(0, MAX_HEADER_CONTENT_LENGTH)}...`;

        // no all data in header => also add complete string
        parts.push( data );
      }
      break;

    case "symbol":
      metaHeader = createMetaHeader( logEvent );
      header = `${metaHeader} Symbol(${ data.description || "" })`;
      break;

    case "undefined":
      metaHeader = createMetaHeader( logEvent );
      header = `${metaHeader} (undefined)`;
      break;

    case "boolean":
    case "number":
    case "bigint":
      metaHeader = createMetaHeader( logEvent );
      header = `${metaHeader} (${typeof data}) ${data}`;
      break;

    case "function":
      if( data.name )
      {
        metaHeader = createMetaHeader( logEvent );
        header = `${metaHeader} (function ${data.name})`;
      }
      else {
        metaHeader = createMetaHeader( logEvent );
        header = `${metaHeader} (function)`;
      }
      break;

    case "object":
      if( data === null )
      {
        metaHeader = createMetaHeader( logEvent );
        header = `${metaHeader} (null)`;
      }
      else if( data instanceof ArgumentsArray )
      {
        metaHeader = createMetaHeader( logEvent );
        header = metaHeader;

        for( let j = 0, n = data.length; j < n; j = j + 1 )
        {
          parts.push( data[j] );
        }
      }
      else {
        metaHeader = createMetaHeader( logEvent );
        header = metaHeader;
        parts.push( data );
      }
      break;

    default:
      // everything else?
      metaHeader = createMetaHeader( logEvent );
      header = metaHeader;
      parts.push( data );
  }

  return { methodName, header, parts };
}

// -----------------------------------------------------------------------------

/**
 * Split EventLog data into a header and body part that can be outputted
 * to the console
 * - This function only processes normal data types, not Error objects
 *
 * @param {*} eventLogData
 *
 * @returns {object} { header: <string|null>, body: <*|null> }
 */
// function createHeaderAndBody( logEvent )
// {
//   // TODO: use type, sequenceId, at, context to create header

//   const baseHeader = "Jens:";

//   let body = logEvent.data;

//   if( body instanceof Error )
//   {
//     throw new Error(
//       "Invalid parameter [eventLogData] (cannot process Error object)");
//   }

//   // let baseHeader = `${logEvent.sequenceId} `;

//   if( isArrayLike( body ) )
//   {
//     return { header: null, body };
//   }

//   let header = null;

//   switch( typeof body )
//   {
//     case "string":
//       if( !body.length )
//       {
//         header = "(empty string)";
//         body = null;
//       }
//       else if( body.length < MAX_HEADER_CONTENT_LENGTH ) {
//         header = JSON.stringify( body ); // add quotes
//         body = null;
//       }
//       else {
//         header = body.slice(0, MAX_HEADER_CONTENT_LENGTH) + "...";
//         // no all data in header => keep body
//       }
//       break;

//     case "symbol":
//       header = `Symbol(${ body.description || "" })`;
//       body = null;
//       break;

//     case "undefined":
//       header = "(undefined)";
//       //body = null; // leave body = undefined
//       break;

//     case "boolean":
//     case "number":
//     case "bigint":
//       header = `(${typeof body}) ${body}`;
//       body = null;
//       break;

//     case "function":
//       if( body.name )
//       {
//         header = `(function ${body.name})`;
//       }
//       else {
//         header = "(function)";
//       }
//       break;

//     case "object":
//       if( body === null )
//       {
//         header = "(null)";
//         body = null;
//       }
//   }

//   return { header, body };
// }



// >>> OLD STUFF BELOW!!!




/* ------------------------------------------------------------------ Imports */

/* ---------------------------------------------------------------- Internals */

/* ------------------------------------------------------------------ Exports */

// export { DEBUG, INFO, WARNING, ERROR };

// -------------------------------------------------------------------- Function

// /**
//  * Log a formatted message to the console
//  *
//  * @param {object} event - Object that contains the information to be logged
//  *
//  * @param {string[]} args - Log data
//  *
//  * @param {DEBUG|INFO|WARNING|ERROR} event.type - Log information type
//  * @param {string} dateTimeString
//  * @param {string} baseFileName
//  * @param {string} lineNumber
//  * @param {string} functionName
//  */
// export function logEvent( event )
// {
//   if( !(event instanceof Object) )
//   {
//     throw new Error("Missing or invalid parameter [event]");
//   }

//   let stack2;

//   // -- Add previous error to stack (fixme: recursive)

//   let eventArguments = Array.from( event.args );

//   for( let j = eventArguments.length - 1; j >= 0; j = j - 1 )
//   {
//     const arg = eventArguments[j];

//     if( arg instanceof Error && arg.previousError )
//     {
//       eventArguments.splice( j + 1, 0, arg.previousError );
//     }
//   } // end for

//   switch( event.type )
//   {
//     case INFO:
//     case ERROR:
//       stack2 = null;

//       //
//       // Format "labelled error" events
//       //
//       if( eventArguments.length > 1 &&
//           typeof eventArguments[0] === "string" &&
//           eventArguments[1] instanceof Error  )
//       {
//         eventArguments[0] = `\n${eventArguments[0]}\n`;
//       }

//       break;

//     case DEBUG:
//     case WARNING:
//       stack2 = _formattedStack( event.stack );
//       break;

//     default:
//       throw new Error(`Invalid log item type [${event.type}]`);
//   }

//   const prependLine = eventArguments[0];

//   eventArguments = Array.prototype.slice.call( eventArguments, 1 );

//   writeGrouped( prependLine, eventArguments, stack2 );
// }

// // -------------------------------------------------------------------- Function

// /**
//  * Write a grouped message to the console
//  *
//  * @param {string} header
//  * @param {string[]} lines
//  * @param {string[]} stack2
//  */
// export function writeGrouped( header, lines, stack2 )
// {
//   console.group( header );

//   for( let j = 0, n = lines.length; j < n; j = j + 1 )
//   {
//     console.log( lines[j] );
//   }

//   if( stack2 )
//   {
//     console.groupCollapsed( stack2[0] );

//     console.log( stack2[1] );

//     console.groupEnd();
//   }

//   console.groupEnd();
// }

// // -------------------------------------------------------------------- Function

// /**
//  * Convert a stack (trace) to a formatted string
//  *
//  * @param {CallSite[]} stack - List of CallSite objects
//  *
//  * @returns {string[]} [ <first-stack-item-string>, <rest> ]
//  */
// function _formattedStack( stack )
// {
//   if( !stack || !stack.length )
//   {
//     return null;
//   }

//   let first;
//   let rest = "";

//   // file://<rootPath>/...
//   // const fileNameOffset = paths.rootPath.length + 8;
//   try{
//     for( let j = 0, n = stack.length; j < n; j = j + 1 )
//     {
//       const current = stack[j];

//       let fileName =
//         current.getFileName ? current.getFileName() : "";
//       const lineNumber =
//         current.getLineNumber ? current.getLineNumber() : "";

//       const functionName =
//         current.getFunctionName ? current.getFunctionName() : "";

//       if( fileName &&
//           (fileName.endsWith("trace.js") || fileName.endsWith("log.js")) )
//       {
//         // ignore trace inside log.js and trace.js
//         continue;
//       }

//       // if( fileName.startsWith(location.origin) )
//       // {
//       //   fileName = fileName.slice( location.origin.length );
//       // }

//       let lineChar;

//       if( j < n - 1)
//       {
//         lineChar = "├";
//       }
//       else {
//         lineChar = "└";
//       }

//       if( !first )
//       {
//         rest += `${lineChar} ${fileName}:${lineNumber} (${functionName})\n`;

//         fileName = fileName.slice( fileName.lastIndexOf("/") + 1 );

//         first = `${fileName}:${lineNumber} (${functionName})`;
//       }
//       else {
//         rest += `${lineChar} ${fileName}:${lineNumber} (${functionName})\n`;
//       }
//     }
//   } catch(e)
//   {
//     console.log( e );
//   }

//   const result = [ first, rest ];

//   return result;
// }

// /* ----------------------------------------------------------- Export default */

// export default {
//   // write,
//   logEvent
// };
