
export const STOPPED = Symbol("stopped");
export const STARTING = Symbol("starting");
export const RUNNING = Symbol("running");
export const STOPPING = Symbol("stopping");
export const UNAVAILABLE = Symbol("unavailable");
export const ERROR = Symbol("error");

const STATE_LABELS =
  {
    [STOPPED]: "stopped",
    [STARTING]: "starting",
    [RUNNING]: "running",
    [STOPPING]: "stopping",
    [UNAVAILABLE]: "unavailable",
    [ERROR]: "error"
  };


// STOPPED.toString = function() { return "JENS"; };


const DISPLAY_STATE_LABELS =
  {
    "stopped": STOPPED,
    "starting": STARTING,
    "running": RUNNING,
    "stopping": STOPPING,
    "unavailable": UNAVAILABLE,
    "error": ERROR
  };

/**
 * If a state label has been supplied (a symbol), the state label will be
 * returned. If a display string has been supplied (e.g. "stopping"), the
 * corresponding state label will be returned.
 *
 * @param {Symbol|string} state_label_or_string
 *
 * @returns {Symbol} state label
 */
export function state_label( state_label_or_string )
{
  if( typeof state_label_or_string === "symbol" )
  {
    if( STATE_LABELS[ state_label_or_string ] )
    {
      return state_label_or_string;
    }

    throw new Error(
      `Invalid parameter ` +
      `[state_label_or_string=${state_label_or_string.toString()}]`);
  }

  const stateLabel = DISPLAY_STATE_LABELS[ state_label_or_string ];

  if( !stateLabel )
  {
    throw new Error(
      `Invalid parameter [state_label_or_string=${state_label_or_string}]`);
  }

  return stateLabel;
}

/**
 * Returns the service state as a string, e.g. for display purposes
 *
 * @param {Symbol} state - Service state
 *
 * @returns {string} String representation of the service state
 */
export function displayState( state )
{
  return STATE_LABELS[ state ] || "UNKNOWN";
}