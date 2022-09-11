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

import { DEBUG, INFO, WARNING,ERROR } from "@hkd-base/types/log-types.js";

import { getOutputStream,
         OUTPUT_LABEL_CONSOLE } from "@hkd-base/helpers/log.js";

import { ArgumentsArray } from "@hkd-base/types/array-types.js";

import { isIterable } from "@hkd-base/helpers/is.js";

/* ---------------------------------------------------------------- Internals */

const MAX_HEADER_CONTENT_LENGTH = 47;

const CONSOLE_METHOD_LOG = "log";

const CONSOLE_METHOD_DEBUG = "debug";
const CONSOLE_METHOD_INFO = "info";
const CONSOLE_METHOD_ERROR = "error";
const CONSOLE_METHOD_WARNING = "warn";

const CONSOLE_METHODS =
  {
    [DEBUG]: CONSOLE_METHOD_DEBUG,
    // [DEBUG]: CONSOLE_METHOD_LOG,

    [INFO]: CONSOLE_METHOD_INFO,
    // [INFO]: CONSOLE_METHOD_LOG,

    [WARNING]: CONSOLE_METHOD_WARNING,
    [ERROR]: CONSOLE_METHOD_ERROR
  };

// const LOG_FUNCTION_NAMES = new Set( DEBUG, INFO, WARNING, ERROR );

/**
 * Unsubscribe function to disable console logging
 * @type {function}
 */
let unsubscribeConsoleLogging;

// -----------------------------------------------------------------------------

/**
 * Terminal Markup codes
 *
 * printing-colorful-text-in-terminal-when-run-node-js-script
 *
 * @see https://coderwall.com/p/yphywg/
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code
 */
const MARKUP =
  {
    reset: "\x1b[0m",


    cyan: "\x1b[36m",
    magenta: "\x1b[35m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",

    green: "\x1b[32m",

    white: "\x1b[37m",
    black: "\x1b[30m",

    brightWhite: "\x1b[97m",
    brightBlack: "\x1b[90m",

    bgWhite: "\x1b[47m",

    bgBrightBlack: "\x1b[100m",
    bgBlack: "\x1b[40m",
    bgRed: "\x1b[41m",
    bgGreen: "\x1b[42m",
    //bgYellow: "\x1b[43m",
    bgBrightYellow: "\x1b[103m",
    bgCyan: "\x1b[46m",
    bgBrightCyan: "\x1b[106m",
    bgMagenta: "\x1b[45m",
    bgBlue: "\x1b[44m",

    bold: "\x1b[1m",
    dim: "\x1b[2m",
    italic: "\x1b[3m",
    underline: "\x1b[4m",

    newline: "\n"
  };

// -----------------------------------------------------------------------------

/**
 * Disable console logginh
 * - Stops outputting log events from the systsemLog stream to the console
 */
export function disableConsoleLogging()
{
  if( unsubscribeConsoleLogging )
  {
    unsubscribeConsoleLogging();
    unsubscribeConsoleLogging = null;
  }
}

// -----------------------------------------------------------------------------

/**
 * Enable console logging
 * - Outputs log events from the systemLog stream to the console
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

// /**
//  * Format a context object a key value pairs
//  * - If context is null, an empty string is returned
//  *
//  * @param {object|null} context [description]
//  *
//  * @returns {string|null} formatted context (key value pairs)
//  */
// function formatContext( context )
// {
//   expectObject( context, "Missing or invalid parameter [context]" );

//   let str = "";

//   for( let key in context )
//   {
//     str += `,${key}=${JSON.stringify(context[key])}`;
//   }

//   if( str.length )
//   {
//     return `[${str.slice(1)}]`;
//   }

//   return "";
// }

/**
 * Output console trace if running in browser
 */
function tryOutputConsoleTrace( logEvent )
{
  if( !isNodeJs )
  {
    if( logEvent && logEvent.type )
    {
      console.groupCollapsed(`trace (${logEvent.type})`);
    }
    else {
      console.groupCollapsed(`trace`);
    }

    console.trace();
    console.groupEnd();
  }
}

/* ------------------------------------------------------------------ Exports */

/**
 * Print logEvents to the browser console
 *
 * @param {object} logEvent
 */
export function defaultEventLogPrinter( logEvent )
{
  expectObject( logEvent, "Missing or invalid parameter [logEvent]" );

  // if( logEvent.type === DEBUG )
  // {
  //   console.log("@@@@print", JSON.stringify( logEvent, null, 2 ) );
  // }

  // console.log("@@@@print", logEvent.data instanceof Error);

  console.log(); // newline

  if( logEvent.data instanceof Error || ERROR === logEvent.type )
  {
    let error = logEvent.data;

    const context = logEvent.context;

    let errorHeader = createHeader( logEvent );

    if( !(error instanceof Error) )
    {
      const messageOrAttributes = error;

      if( typeof messageOrAttributes === "string" )
      {
        error = new Error( messageOrAttributes );
      }

      if( messageOrAttributes instanceof ArgumentsArray )
      {
        if( typeof messageOrAttributes[0] === "string" )
        {
          const message = messageOrAttributes.shift();

          error = new Error( message );
          error.attributes = messageOrAttributes;
        }
      }

      if( !(error instanceof Error) )
      {
        error = new Error("Unknown error");
        error.attributes = messageOrAttributes;
      }
    }

    printError( { errorHeader, context, error } );
  }
  else {
    //
    // logEvent does *not* contain an Error
    //
    let { header,
          parts } = getHeaderAndParts( logEvent );

    // const methodName = typeToConsoleMethod( logEvent.type );

    if( header )
    {
      if( !parts.length )
      {
        // console[ methodName ]( header );
        if( isNodeJs )
        {
          console.log( header );
        }
        else {
          console.groupCollapsed( header );
          tryOutputConsoleTrace( logEvent );
          console.groupEnd();
        }
      }
      else {
        console.group( header );

        for( const data of parts )
        {
          //console[ methodName ]( data );
          console.log( data );
        }

        tryOutputConsoleTrace( logEvent );

        console.groupEnd();
      }
    }
    else {
      for( const data of parts )
      {
        // console[ methodName ]( data );
        console.log( data );
      }

      tryOutputConsoleTrace( logEvent );
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
 * Print a formatted Error to the console
 *
 * @param {string} _.errorHeader
 * @param {string} _.context
 * @param {string} _.error
 */
function printError( { errorHeader, context, error }  )
{
  expectObject( error, "Missing or invalid parameter [error]");

  if( error.cause )
  {
    //
    // Create a group for an Error that contains a `cause`
    //
    const causes = errorCauseToArray( error );

    if( errorHeader )
    {
      console.group( errorHeader );
    }

    // if( !context )
    // {
    //   console.group( `Error: ${error.message}` );
    // }
    // else {
    //   console.group( `Error: ${error.message}`, formatContext( context ) );
    // }

    // console.error( 123, error );
    console.log( error.message );

    if( error.attributes )
    {
      console.log();
      console.log("Attributes:");
      console.log( error.attributes );
    }

    console.log( error.stack );


    for( let j = 0, n = causes.length; j < n; j = j + 1 )
    {
      if( j > 0 )
      {
        console.log();
      }

      const cause = causes[j];

      console.log( "Cause:" );
      console.log( cause.message );
      console.log( cause.stack );

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

    if( context )
    {
      console.log();
      console.log( "Context:" );
      console.log( context );
    }

    if( errorHeader )
    {
      console.groupEnd();
    }
  }
  else {
    // const stack = error.stack.split("\n");
    // error.stack = stack.slice( 3 ).join("\n");
    // console.log( JSON.stringify( error.stack ) );

    //
    // Error without `cause`
    //
    console.log( errorHeader );
    console.error( error.message );

    if( error.attributes )
    {
      console.log("Attributes:");

      const attributes = error.attributes;

      if( attributes instanceof ArgumentsArray )
      {
        for( const current of attributes )
        {
          if( current instanceof Error )
          {
            printError( { error: current } );
          }
        }
      }

      if( isIterable( attributes ) )
      {
        for( const current of attributes )
        {
          if( current instanceof Error )
          {
            printError( { error: current } );
          }
          else {
            console.log( current );
          }
        }
      }
      else {
        console.log( error.attributes );
      }
    }

    console.log("Stack:");
    console.log( error.stack );
  }
}


// -----------------------------------------------------------------------------

// eslint-disable-next-line no-undef
const isNodeJs = (typeof process !== "undefined" && process.env);

// eslint-disable-next-line no-undef
const enableMarkup = isNodeJs && ("development" === process.env.NODE_ENV);

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
function createHeader( logEvent, message )
{
  const { sequenceId, type, at, context } = logEvent;

  let header = "";

  let functionName;

  if( isNodeJs )
  {
    const getSourceMappedStack = global.getSourceMappedStack;

    if( !getSourceMappedStack )
    {
      // header = `#${sequenceId} (${type})`;
      header = `${sequenceId} (${type})`;
    }
    else {
      const data = logEvent.data;

      let error = (data instanceof Error) ? data : null;

      if( !error )
      {
        if( context.e )
        {
          error = context.e;
        }
      }

      const stack = getSourceMappedStack( { error } );

      let stackItemOfInterest;

      for( let j = 0, n = stack.length; j < n; j = j + 1 )
      {
        stackItemOfInterest = stack[j];

        const functionName = stackItemOfInterest.getFunctionName();

        if( functionName === type ) /* type=debug, info, warning, error */
        {
          //
          // The next stack item is the one we need
          //
          stackItemOfInterest = stack[ j+1 ];

          // console.log("FOUND", stackItemOfInterest, functionName);
          break;
        }

        // if( LOG_FUNCTION_NAMES.has(functionName) )
        // {
        //   //
        //   // The next stack item is the one we need
        //   //
        //   stackItemOfInterest = stack[ j+1 ];

        //   console.log("FOUND", stackItemOfInterest, functionName);
        //   break;
        // }
      } // end for

      // console.log( 123, stack.toString() );

      if( !stackItemOfInterest )
      {
        // header = `#${sequenceId} (${type})`;
        header = `${sequenceId} (${type})`;
      }
      else {
        const fileName = stackItemOfInterest.getFileName();
        const lineNumber = stackItemOfInterest.getLineNumber();

        functionName = stackItemOfInterest.getFunctionName();

        // header = `#${sequenceId} ${fileName}:${lineNumber}`;
        header = `${sequenceId} ${fileName}:${lineNumber}`;
      }
    }

  } // end: if( isNodeJs )

  if( context && context.className )
  {
    const className = context.className;

    if( functionName )
    {
      if( functionName === className )
      {
        header += ` (${context.className}.constructor)`;
      }
      else {
        header += ` (${context.className}.${functionName})`;
      }
    }
    else {
      header += ` (${context.className})`;
    }
  }
  else {
    if( functionName )
    {
      header += ` (${functionName})`;
    }
  }

  //
  // TODO: other contexts?
  //

  if( isNodeJs )
  {
    const d = new Date(at);

    const isoStr = d.toISOString();

    header += ` ${isoStr.slice(0, isoStr.length - 6)}Z`;
  }

  if( !isNodeJs && message !== undefined )
  {
    //
    // Do not add message to header on NodeJs
    // (should be added to data by function caller)
    //
    if( header.length )
    {
      header = `${header} ${message}`;
    }
    else {
      header = message;
    }
  }

  if( enableMarkup )
  {
    let headerStyle = "";

    switch( logEvent.type )
    {
      case INFO:
        // headerStyle = MARKUP.brightWhite + MARKUP.bgCyan;
        headerStyle = MARKUP.dim;
        break;

      case DEBUG:
        headerStyle = MARKUP.brightWhite + MARKUP.bgMagenta;
        break;

      case WARNING:
        headerStyle =MARKUP.black + MARKUP.bgBrightYellow;
        break;

      case ERROR:
        headerStyle = MARKUP.brightWhite + MARKUP.bgRed;
        break;

      default:
        headerStyle = MARKUP.brightWhite + MARKUP.bgBlack;
        break;
    }


    return MARKUP.reset +
          `${headerStyle} ${header} ` +
          MARKUP.reset;
  }
  else {
    return header;
  }
  // else {
  //   // return header;
  //   return `(${type})${header}`;
  // }
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

  let data = logEvent.data;

  if( data instanceof Error )
  {
    throw new Error(
      "Invalid parameter [logEvent] " +
      "(eventLog.data should not be an Error object)");
  }

  let header = null;
  let parts = [];

  switch( typeof data )
  {
    case "string":
      if( !data.length )
      {
        const message = "(empty string)";

        header = createHeader( logEvent, message );

        if( isNodeJs )
        {
          parts.push( message );
        }
      }
      else if( INFO === type )
      {
        //
        // We're outputting an info message
        //
        header = createHeader( logEvent );
        parts.push( data );
      }
      else if( data.length < MAX_HEADER_CONTENT_LENGTH)
      {
        //
        // data is a short string
        //
        const message = data;

        header = createHeader( logEvent, message );

        if( isNodeJs )
        {
          parts.push( message );
        }
      }
      else {
        const message = `${data.slice(0, MAX_HEADER_CONTENT_LENGTH)}...`;

        header = createHeader( logEvent, message );

        // no all data in header => also add complete string
        parts.push( data );
      }
      break;

    case "symbol":
      {
        const message = `Symbol(${ data.description || "" })`;

        header = createHeader( logEvent, message );

        if( isNodeJs )
        {
          parts.push( message );
        }
      }
      break;

    case "undefined":
      {
        const message = "(undefined)";

        header = createHeader( logEvent, message );

        if( isNodeJs )
        {
          parts.push( message );
        }
      }
      break;

    case "boolean":
    case "number":
    case "bigint":
      {
        const message = `(${typeof data}) ${data}`;

        header = createHeader( logEvent, message );

        if( isNodeJs )
        {
          parts.push( message );
        }
      }
      break;

    case "function":
      if( data.name )
      {
        const message = `(function ${data.name})`;

        header = createHeader( logEvent, message );

        if( isNodeJs )
        {
          parts.push( message );
        }
      }
      else {
        const message = `(function)`;

        header = createHeader( logEvent, message );

        if( isNodeJs )
        {
          parts.push( message );
        }
      }
      break;

    case "object":
      if( data === null )
      {
        const message = `(null)`;

        header = createHeader( logEvent, message );

        if( isNodeJs )
        {
          parts.push( message );
        }
      }
      else if( data instanceof ArgumentsArray )
      {
        header = createHeader( logEvent );

        for( let j = 0, n = data.length; j < n; j = j + 1 )
        {
          parts.push( data[j] );
        }
      }
      else {
        header = createHeader( logEvent );
        parts.push( data );
      }
      break;

    default:
      // everything else?
      header = createHeader( logEvent );
      parts.push( data );
  }

  return { header, parts };
}
