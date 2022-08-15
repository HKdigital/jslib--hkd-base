/**
 * console.js
 *
 * @description
 * This file contains code that helps working with the console (bash like
 * terminals). E.g. for logging
 *
 * @example
 *
 * import { log, DEBUG } from "@platform/helpers/console.js";
 *
 * log(
 * {
 *   args: ["Hello", "World"],
 *   type: DEBUG,
 *   dateTimeString: "2020-01-01",
 *   baseFileName: "todo.js",
 *   lineNumber: "123",
 *   functionName: "do_something" } );
 *
 * output>>>
 * todo.js:123:do_something at 2020-01-01
 * Hello
 * World
 * <<<output
 */

/* ------------------------------------------------------------------ Imports */

import { expectObject } from "@hkd-base/helpers/expect.js";
import { errorCauseToArray,
         catchUnhandledExceptions } from "@hkd-base/helpers/exceptions.js";

import { DEBUG, INFO, WARNING, ERROR } from "@hkd-base/types/log-types.js";

import { getOutputStream,
         deleteOutputStream,
         OUTPUT_LABEL_CONSOLE } from "@hkd-base/helpers/log.js";

import { defer } from "@hkd-base/helpers/process.js";

/* ---------------------------------------------------------------- Internals */

const MAX_HEADER_CONTENT_LENGTH = 67;

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

/**
 * Enable console logging
 * - Outputs log events from the systemLog stream to the console
 * - Enables catching uncaught exceptions
 */
export function enableConsoleLogging( eventLogPrinter=defaultEventLogPrinter )
{
  expectObject( eventLogPrinter,
    "Invalid parameter for property [eventLogPrinter]");

  getOutputStream( OUTPUT_LABEL_CONSOLE ).subscribe( eventLogPrinter );

  catchUnhandledExceptions();
}

// -----------------------------------------------------------------------------

/**
 * Disable logging of system log events to the console
 *
 * @param {boolean} [showWarning=true]
 */
export function disableConsoleLogging( showWarning=true )
{
  disableAutoStartConsoleLogging = true;

  deleteOutputStream( OUTPUT_LABEL_CONSOLE );

  if( showWarning )
  {
    console.log("[!] Disabled system log event console messages");
  }
}

// -----------------------------------------------------------------------------

export let disableAutoStartConsoleLogging = false;

defer( () => {
  if( !disableAutoStartConsoleLogging )
  {
    enableConsoleLogging();
  }
} );

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
    const methodName = typeToConsoleMethod( logEvent.type );

    let { header, body } = splitHeaderAndBody( logEvent.data );

    if( header )
    {
      if( DEBUG === logEvent.type )
      {
        header = "(debug) " + header;
      }

      if( body )
      {
        console.log( header, body );
      }
      // else if( body === undefined )
      // {
      //   console.trace( header );
      // }
      else {
        console.log( header );
      }
    }
    else {
      //
      // Print message without header
      //
      if( body ) {
        console[ methodName ]( body );
      }
      else {
        console.log("(empty message)");
      }
    }
  }
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
function splitHeaderAndBody( eventLogData )
{
  let body = eventLogData;

  if( body instanceof Error )
  {
    throw new Error();
  }

  let header = null;

  switch( typeof body )
  {
    case "string":
      if( !body.length )
      {
        header = "(empty string)";
        body = null;
      }
      else if( body.length < MAX_HEADER_CONTENT_LENGTH ) {
        header = JSON.stringify( body ); // add quotes
        body = null;
      }
      else {
        header = body.slice(0, MAX_HEADER_CONTENT_LENGTH) + "...";
        // no all data in header => keep body
      }
      break;

    case "symbol":
      header = `Symbol(${ body.description || "" })`;
      body = null;
      break;

    case "undefined":
      header = "(undefined)";
      //body = null; // leave body = undefined
      break;

    case "boolean":
    case "number":
    case "bigint":
      header = `(${typeof body}) ${body}`;
      body = null;
      break;

    case "function":
      if( body.name )
      {
        header = `(function ${body.name})`;
      }
      else {
        header = "(function)";
      }
      break;

    case "object":
      if( body === null )
      {
        header = "(null)";
        body = null;
      }
  }

  return { header, body };
}



// >>> OLD STUFF BELOW!!!




/* ------------------------------------------------------------------ Imports */

/* ---------------------------------------------------------------- Internals */

/* ------------------------------------------------------------------ Exports */

// export { DEBUG, INFO, WARNING, ERROR };

// -------------------------------------------------------------------- Function

/**
 * Log a formatted message to the console
 *
 * @param {object} event - Object that contains the information to be logged
 *
 * @param {string[]} args - Log data
 *
 * @param {DEBUG|INFO|WARNING|ERROR} event.type - Log information type
 * @param {string} dateTimeString
 * @param {string} baseFileName
 * @param {string} lineNumber
 * @param {string} functionName
 */
export function logEvent( event )
{
  if( !(event instanceof Object) )
  {
    throw new Error("Missing or invalid parameter [event]");
  }

  let stack2;

  // -- Add previous error to stack (fixme: recursive)

  let eventArguments = Array.from( event.args );

  for( let j = eventArguments.length - 1; j >= 0; j = j - 1 )
  {
    const arg = eventArguments[j];

    if( arg instanceof Error && arg.previousError )
    {
      eventArguments.splice( j + 1, 0, arg.previousError );
    }
  } // end for

  switch( event.type )
  {
    case INFO:
    case ERROR:
      stack2 = null;

      //
      // Format "labelled error" events
      //
      if( eventArguments.length > 1 &&
          typeof eventArguments[0] === "string" &&
          eventArguments[1] instanceof Error  )
      {
        eventArguments[0] = `\n${eventArguments[0]}\n`;
      }

      break;

    case DEBUG:
    case WARNING:
      stack2 = _formattedStack( event.stack );
      break;

    default:
      throw new Error(`Invalid log item type [${event.type}]`);
  }

  const prependLine = eventArguments[0];

  eventArguments = Array.prototype.slice.call( eventArguments, 1 );

  writeGrouped( prependLine, eventArguments, stack2 );
}

// -------------------------------------------------------------------- Function

/**
 * Write a grouped message to the console
 *
 * @param {string} header
 * @param {string[]} lines
 * @param {string[]} stack2
 */
export function writeGrouped( header, lines, stack2 )
{
  console.group( header );

  for( let j = 0, n = lines.length; j < n; j = j + 1 )
  {
    console.log( lines[j] );
  }

  if( stack2 )
  {
    console.groupCollapsed( stack2[0] );

    console.log( stack2[1] );

    console.groupEnd();
  }

  console.groupEnd();
}

// -------------------------------------------------------------------- Function

/**
 * Convert a stack (trace) to a formatted string
 *
 * @param {CallSite[]} stack - List of CallSite objects
 *
 * @returns {string[]} [ <first-stack-item-string>, <rest> ]
 */
function _formattedStack( stack )
{
  if( !stack || !stack.length )
  {
    return null;
  }

  let first;
  let rest = "";

  // file://<rootPath>/...
  // const fileNameOffset = paths.rootPath.length + 8;
  try{
    for( let j = 0, n = stack.length; j < n; j = j + 1 )
    {
      const current = stack[j];

      let fileName =
        current.getFileName ? current.getFileName() : "";
      const lineNumber =
        current.getLineNumber ? current.getLineNumber() : "";

      const functionName =
        current.getFunctionName ? current.getFunctionName() : "";

      if( fileName &&
          (fileName.endsWith("trace.js") || fileName.endsWith("log.js")) )
      {
        // ignore trace inside log.js and trace.js
        continue;
      }

      // if( fileName.startsWith(location.origin) )
      // {
      //   fileName = fileName.slice( location.origin.length );
      // }

      let lineChar;

      if( j < n - 1)
      {
        lineChar = "├";
      }
      else {
        lineChar = "└";
      }

      if( !first )
      {
        rest += `${lineChar} ${fileName}:${lineNumber} (${functionName})\n`;

        fileName = fileName.slice( fileName.lastIndexOf("/") + 1 );

        first = `${fileName}:${lineNumber} (${functionName})`;
      }
      else {
        rest += `${lineChar} ${fileName}:${lineNumber} (${functionName})\n`;
      }
    }
  } catch(e)
  {
    console.log( e );
  }

  const result = [ first, rest ];

  return result;
}

/* ----------------------------------------------------------- Export default */

export default {
  // write,
  logEvent
};
