
/**
 * log.js
 */

/* ------------------------------------------------------------------ Imports */

import LogStream from "@hkd-base/classes/LogStream.js";

import ValueStore from "@hkd-base/classes/ValueStore.js";

import { expectNotEmptyString } from "@hkd-base/helpers/expect.js";

import { isIterable } from "@hkd-base/helpers/is.js";

// import { DEBUG, INFO, WARNING, ERROR } from "@hkd-base/types/log-types.js";

// import { defer } from "@hkd-base/helpers/process.js";

import { enableConsoleLogging } from "@hkd-base/helpers/console.js";

import { catchUncaughtExceptions } from "@hkd-base/helpers/exceptions.js";

/* ---------------------------------------------------------------- Internals */

const OUTPUT_LABEL_CONSOLE = "console";

const systemLog = new LogStream( /* { source: "system-log" } */ );

const outputs = {};

// let logLevelWarning = false;

/* ---------------------------------------------------------------- Externals */

export { OUTPUT_LABEL_CONSOLE };

export { systemLog };

// -----------------------------------------------------------------------------
// Export friendlier names for lazy debuggers

export { systemLog as log };

export const debug = systemLog.debug.bind( systemLog );

// -----------------------------------------------------------------------------

/**
 * Get a logger instance that logs event with the specified moduleName as
 * context
 *
 * @param {string} moduleName
 *
 * @returns {object} logger instance
 */
export function getModuleLogger( moduleName )
{
  expectNotEmptyString( moduleName,
    "Missing or invalid parameter [moduleName]" );

  const log = new LogStream( { className: moduleName } );

  log.sendTo( systemLog );

  return log;
}

// -----------------------------------------------------------------------------
// - Turn on console logging by default
// - Enable catch uncaught exceptions and forward to console log

catchUncaughtExceptions();
enableConsoleLogging();

// -----------------------------------------------------------------------------

/**
 * Silence (drop) all console.log messages that are not of type `warning` or
 * `error`
 */
// export function setLogLevelWarning()
// {
//   logLevelWarning = true;
// }

// -----------------------------------------------------------------------------

/**
 * Unsilence all global console.log messages
 */
// export function restoreLogLevelDefault()
// {
//   logLevelWarning = false;
// }

// -----------------------------------------------------------------------------

/**
 * Processor that does nothing
 * - Returns the original logEvent
 *
 * @param {LogEvent} logEvent
 *
 * @returns {LogEvent} the unchanged log event
 */
export function passThroughProcessor( logEvent )
{
  return logEvent;
}

// -----------------------------------------------------------------------------

/**
 * Processor that adds an Error instance to the context that can be used for
 * printing the program trace
 *
 * @param {LogEvent} logEvent
 *
 * @returns {LogEvent} the unchanged log event
 */
export function consoleLogProcessor( logEvent )
{
  if( !logEvent.context )
  {
    logEvent.context = {};
  }

  const context = logEvent.context;

  context.e = new Error();

  Object.defineProperty( context, "e",
    {
      enumerable: false
    } );

  return logEvent;
}

// -----------------------------------------------------------------------------

/**
 * Processor that passes through log events unless a minimum log level has
 * been set (see setLogLevelWarning)
 * set.
 *
 * @param {LogEvent} logEvent
 *
 * @returns {LogEvent} the unchanged log event
 */
// export function logLevelProcessor( logEvent )
// {
//   if( !logLevelWarning )
//   {
//     return logEvent;
//   }

//   switch( logEvent.type )
//   {
//     case DEBUG:
//     case INFO:
//       // silence all log levels below "warning"
//       return null;
//   }

//   return logEvent;
// }

// -----------------------------------------------------------------------------

/**
 * Register a processor function that converts logEvent objects to
 * the desired format
 * - Defines a new output if the output defined by the outputLabel
 *   does not exist yet
 * - Unregisters the existing processor (if any)
 *
 * --
 * @callback Processor
 * @param {object} logEvent
 *
 * @returns {*|null} converted data or null if no output should be generated
 * --
 *
 * @param {Processor} processorFn
 *   Function that converts logEvent to the desired output data format
 *
 * @param {string} [outputLabel=OUTPUT_LABEL_CONSOLE]
 */
export function setProcessor( processorFn, outputLabel=OUTPUT_LABEL_CONSOLE )
{
  expectNotEmptyString( outputLabel, "Invalid parameter [outputLabel]" );

  // -- Get or create output

  let output = outputs[ outputLabel ];

  if( !output )
  {
    const stream = new ValueStore();

    stream.get = () => {
      throw new Error("Method not supported (use subscribe)");
    };

    output =
      outputs[ outputLabel ] =
        {
          stream
        };
  }
  else if( output.unsubscribeProcessor )
  {
    // Unsubscribe existing processor

    output.unsubscribeProcessor();
  }

  const outputStream = output.stream;

  // -- Subscribe processor

  output.unsubscribeProcessor =
    systemLog.subscribe( ( logEvent ) => {

      if( !outputStream.hasSubscribers.get() )
      {
        // No subscribers => nothing to do
        return;
      }

      const convertedLogEvent = processorFn( logEvent );

      if( null === convertedLogEvent )
      {
        //
        // No output should be set in the output stream
        //
        return;
      }
      else if( isIterable( convertedLogEvent ) )
      {
        //
        // The converted event data is iterable
        //
        for( const current of convertedLogEvent )
        {
          // console.log("convertedLogEvent", current);

          outputStream.set( current );
        } // end for

        return;
      }

      //
      // convertedLogEvent is not iterable
      //
      outputStream.set( convertedLogEvent );

      return;
    } );
}

// -----------------------------------------------------------------------------

/**
 * Get the specified output stream
 * - An output stream sends processed event data to the stream subscribers,
 *   e.g. output that is formatted to display nicely in a browser or NodeJS
 *   console.
 * - Use the `setProcessor` function to install a custom processor for an
 *   output at choice.
 *
 * @param {string} [outputLabel=OUTPUT_LABEL_CONSOLE]
 *
 * @returns {object} output stream that can be subscribed to
 */
export function getOutputStream( outputLabel=OUTPUT_LABEL_CONSOLE )
{
  expectNotEmptyString( outputLabel, "Invalid parameter [outputLabel]" );

  let output = outputs[ outputLabel ];

  if( !output )
  {
    if( OUTPUT_LABEL_CONSOLE === outputLabel )
    {
      //
      // Auto create output `OUTPUT_LABEL_CONSOLE`
      //
      setProcessor( consoleLogProcessor, OUTPUT_LABEL_CONSOLE );

      output = outputs[ OUTPUT_LABEL_CONSOLE ];
    }
    else {
      throw new Error(`Output stream [${outputLabel}] was not found`);
    }
  }

  const stream = output.stream;

  return { subscribe: stream.subscribe.bind( stream ) };
}

// -----------------------------------------------------------------------------

/**
 * Delete an output stream
 * - Removes all subscribers
 * - Deletes the output stream
 *
 * @param {string} [outputLabel=OUTPUT_LABEL_CONSOLE]
 */
export function deleteOutputStream( outputLabel=OUTPUT_LABEL_CONSOLE )
{
  expectNotEmptyString( outputLabel, "Invalid parameter [outputLabel]" );

  const output = outputs[ outputLabel ];

  if( !output )
  {
    // Nothing to do
    return;
  }

  const stream = output.stream;

  delete outputs[ outputLabel ];

  stream.unsubscribeAll();
}

// -----------------------------------------------------------------------------

// export let disableAutoStartConsoleLogging = false;

// defer( () => {
//   if( !disableAutoStartConsoleLogging )
//   {
//     console.log("[!] Automatically enabled console logging");
//     enableConsoleLogging();
//   }
// } );

// -----------------------------------------------------------------------------
// - Turn on console logging by default

// defer( () => {
//   //
//   // TODO: add flag to disabled auto start
//   //

//   // console.log("Auto start console log");

//   catchUncaughtExceptions();
//   enableConsoleLogging();
// } );

catchUncaughtExceptions();
enableConsoleLogging();



// >>> OLD STUFF BELOW >>>


/* ------------------------------------------------------------------ Imports */

// import { DEBUG,
//          INFO,
//          WARNING,
//          ERROR } from "../types/log-types.js";

// import { getGlobalConfig } from "./global-config.js";

// // import Console from "@platform/helpers/console.js";

// // import { getStack } from "@platform/helpers/trace.js";

// export { default as LogBase } from "../classes/LogBase.js";

// //
// // Import default console logger as default log facility
// //
// import Console from "./console.js";

// /* ---------------------------------------------------------------- Internals */

// let originalConsole = null;

// // let sequenceId = 1n; // not yet supported in all browsers
// let sequenceId = 1;

// /**
//  * Get the log facity that should be used to log
//  *
//  * @returns {object} log facility
//  */
// function _getLogFacility()
// {
//   let config = getGlobalConfig("log", { facility: Console } );

//   if( config && config.facility )
//   {
//     return config.facility;
//   }

//   throw new Error(
//     "No log facility has been configured.\n" +
//     "Use e.g. setGlobalConfig( 'log', { facility: Console } );");
// }

// /**
//  * Get a string that represents the current date and time
//  *
//  * @returns {string} data time string
//  */
// function _dateTimeString()
// {
//   const date = new Date();

//   return date.toISOString();
// }

/* ------------------------------------------------------------------ Exports */

// export { DEBUG, INFO, WARNING, ERROR };

// /**
//  * Creates a log event that contains the fields
//  * - type
//  * - sequenceId
//  * - dateTimeString
//  * - fileName
//  * - lineNumber
//  * - [functionName]
//  * - [className]
//  * - args
//  * - stack
//  *
//  * @param {string} type - Log item type
//  * @param {mixed} args - List of things to log
//  * @param {object} context - Additional event context (e.g. class name)
//  *
//  * @returns {Object} event
//  */
// export function createEvent( type, args, context )
// {
//   // console.log( "****createEvent", { type, args, context } );

//   const stack = getStack();
//   const stack0 = stack[0];

//   // const baseFileName = pathTool.basename( stack0.fileName );
//   const fileName =
//     stack0.getFileName ? stack0.getFileName() : null;

//   const lineNumber =
//     stack0.getLineNumber ? stack0.getLineNumber() : null;

//   let functionName =
//     stack0.getFunctionName ? stack0.getFunctionName() : null;

//   const dateTimeString = _dateTimeString();

//   const event =
//     {
//       type,
//       sequenceId: sequenceId.toString(),
//       dateTimeString,
//       fileName,
//       lineNumber,
//       args,
//       stack
//     };

//   if( functionName )
//   {
//     event.functionName = functionName;
//   }

//   if( context && context.className )
//   {
//     event.className = context.className;
//   }

//   sequenceId++;

//   return event;
// }

// /**
//  * Log a debug message or data
//  */
// export function debug()
// {
//   // const logEvent = _getLogFacility().logEvent;

//   const event = createEvent( DEBUG, arguments );

//   // logEvent( event );
//   systemLog.debug( event );
// }

// /**
//  * Log an info message or data
//  */
// export function logInfo()
// {
//   // const logEvent = _getLogFacility().logEvent;

//   // const event = createEvent( INFO, arguments );

//   // logEvent( event );

//   systemLog.info.apply( systemLog, arguments );
// }

// /**
//  * Log a warning message or data
//  */
// export function logWarning()
// {
//   // const logEvent = _getLogFacility().logEvent;

//   const event = createEvent( WARNING, arguments );

//   // logEvent( event );

//   systemLog.warning( event );
// }

// /**
//  * Log an error message or data
//  */
// export function logError()
// {
//   // const logEvent = _getLogFacility().logEvent;

//   const event = createEvent( ERROR, arguments );

//   // console.log( 123, (arguments[0] instanceof Error) ? arguments[0].message : null );
//   // console.log( 456, JSON.stringify( arguments, null, 2 ) );
//   // console.log( 789, event );

//   // logEvent( event );

//   systemLog.error( event );
// }

// /**
//  * Log an event
//  *
//  * @param {object} event
//  */
// export function logEvent( event )
// {
//   // console.log( event );

//   // const logEvent = _getLogFacility().logEvent;

//   // logEvent( event );

//   systemLog.debug( event );
// }

// // -----------------------------------------------------------------------------

// /**
//  * Silence (drop) all console.log messages that are not of type `warning` or
//  * `error`
//  */
// export function setLogLevelWarning()
// {
//   if( !originalConsole )
//   {
//     originalConsole =
//       {
//         log: console.log,
//         group: console.group,
//         groupCollapsed: console.groupCollapsed
//       };
//   }

//   const noop = () => {};

//   global.console.log = noop;
//   global.console.group = noop;
//   global.console.groupCollapsed = noop;
// }

// // -----------------------------------------------------------------------------

// /**
//  * Unsilence all global console.log messages
//  */
// export function restoreLogLevelDefault()
// {
//   if( !originalConsole )
//   {
//     // Nothing silenced => nothing to do
//     return;
//   }

//   global.console.log = originalConsole.log;
//   global.console.group = originalConsole.group;
//   global.console.groupCollapsed = originalConsole.groupCollapsed;
// }

// // -------------------------------------------------------------- Export default

// export default {
//   debug,
//   info: logInfo,
//   warning: logWarning,
//   error: logError,
//   event: logEvent,
//   createEvent,
//   DEBUG, INFO, WARNING, ERROR,

//   setLogLevelWarning,
//   restoreLogLevelDefault
// };