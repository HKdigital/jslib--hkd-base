
/* ------------------------------------------------------------------ Imports */

import { DEBUG,
         INFO,
         WARNING,
         ERROR } from "../constants/log-types.js";

import { getGlobalConfig } from "./global-config.js";

// import Console from "@platform/helpers/console.js";

import { getStack } from "@platform/helpers/trace.js";

export { default as LogBase } from "../classes/LogBase.js";

//
// Import default console logger as default log facility
//
import Console from "./console.js";

/* ---------------------------------------------------------------- Internals */

let originalConsole = null;

// let sequenceId = 1n; // not yet supported in all browsers
let sequenceId = 1;

/**
 * Get the log facity that should be used to log
 *
 * @returns {object} log facility
 */
function _getLogFacility()
{
  let config = getGlobalConfig("log", { facility: Console } );

  if( config && config.facility )
  {
    return config.facility;
  }

  throw new Error(
    "No log facility has been configured.\n" +
    "Use e.g. setGlobalConfig( 'log', { facility: Console } );");
}

/**
 * Get a string that represents the current date and time
 *
 * @returns {string} data time string
 */
function _dateTimeString()
{
  const date = new Date();

  return date.toISOString();
}

/* ------------------------------------------------------------------ Exports */

export { DEBUG, INFO, WARNING, ERROR };

/**
 * Creates a log event that contains the fields
 * - type
 * - sequenceId
 * - dateTimeString
 * - fileName
 * - lineNumber
 * - [functionName]
 * - [className]
 * - args
 * - stack
 *
 * @param {string} type - Log item type
 * @param {mixed} args - List of things to log
 * @param {object} context - Additional event context (e.g. class name)
 *
 * @returns {Object} event
 */
export function createEvent( type, args, context )
{
  const stack = getStack();
  const stack0 = stack[0];

  // const baseFileName = pathTool.basename( stack0.fileName );
  const fileName =
    stack0.getFileName ? stack0.getFileName() : null;

  const lineNumber =
    stack0.getLineNumber ? stack0.getLineNumber() : null;

  let functionName =
    stack0.getFunctionName ? stack0.getFunctionName() : null;

  const dateTimeString = _dateTimeString();

  const event =
    {
      type,
      sequenceId: sequenceId.toString(),
      dateTimeString,
      fileName,
      lineNumber,
      args,
      stack
    };

  if( functionName )
  {
    event.functionName = functionName;
  }

  if( context && context.className )
  {
    event.className = context.className;
  }

  sequenceId++;

  return event;
}

/**
 * Log a debug message or data
 */
export function debug()
{
  const logEvent = _getLogFacility().logEvent;

  const event = createEvent( DEBUG, arguments );

  logEvent( event );
}

/**
 * Log an info message or data
 */
export function logInfo()
{
  const logEvent = _getLogFacility().logEvent;

  const event = createEvent( INFO, arguments );

  logEvent( event );
}

/**
 * Log a warning message or data
 */
export function logWarning()
{
  const logEvent = _getLogFacility().logEvent;

  const event = createEvent( WARNING, arguments );

  logEvent( event );
}

/**
 * Log an error message or data
 */
export function logError()
{
  const logEvent = _getLogFacility().logEvent;

  const event = createEvent( ERROR, arguments );

  // console.log( 123, (arguments[0] instanceof Error) ? arguments[0].message : null );
  // console.log( 456, JSON.stringify( arguments, null, 2 ) );
  // console.log( 789, event );

  logEvent( event );
}

/**
 * Log an event
 *
 * @param {object} event
 */
export function logEvent( event )
{
  const logEvent = _getLogFacility().logEvent;

  logEvent( event );
}

// -----------------------------------------------------------------------------

/**
 * Silence (drop) all console.log messages that are not of type `warning` or
 * `error`
 */
export function setLogLevelWarning()
{
  if( !originalConsole )
  {
    originalConsole =
      {
        log: console.log,
        group: console.group,
        groupCollapsed: console.groupCollapsed
      };
  }

  const noop = () => {};

  global.console.log = noop;
  global.console.group = noop;
  global.console.groupCollapsed = noop;
}

// -----------------------------------------------------------------------------

/**
 * Unsilence all global console.log messages
 */
export function restoreLogLevelDefault()
{
  if( !originalConsole )
  {
    // Nothing silenced => nothing to do
    return;
  }

  global.console.log = originalConsole.log;
  global.console.group = originalConsole.group;
  global.console.groupCollapsed = originalConsole.groupCollapsed;
}

// -------------------------------------------------------------- Export default

export default {
  debug,
  info: logInfo,
  warning: logWarning,
  error: logError,
  event: logEvent,
  createEvent,
  DEBUG, INFO, WARNING, ERROR,

  setLogLevelWarning,
  restoreLogLevelDefault
};