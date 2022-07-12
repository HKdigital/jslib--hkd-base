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

import { DEBUG,
         INFO,
         WARNING,
         ERROR } from "@hkd-base/constants/log-types.js";

/* ---------------------------------------------------------------- Internals */

/* ------------------------------------------------------------------ Exports */

export { DEBUG, INFO, WARNING, ERROR };

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
