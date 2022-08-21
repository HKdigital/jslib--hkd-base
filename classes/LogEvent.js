
/* ------------------------------------------------------------------ Imports */

import { expectObjectOrNull,
         expectDefined } from "@hkd-base/helpers/expect.js";

import { DEBUG, INFO, WARNING, ERROR } from "@hkd-base/types/log-types.js";

import { BOOT_STAMP } from "@hkd-base/helpers/unique.js";

let sequenceCounter = 1;

/* ------------------------------------------------------------- Export class */

export default class LogEvent
{
  /**
   * Construct an LogEvent instance
   *
   * @param {string} [type=DEBUG|INFO|WARNING|ERROR]
   * @param {object} [context=null]
   *
   * @param {*|Error} data
   *   Event data, can be anything, e.g. a message, an object or an Error
   *   object.
   */
  constructor( { type=DEBUG, context=null, data } )
  {
    switch( type )
    {
      case DEBUG:
      case INFO:
      case WARNING:
      case ERROR:
        break;

      default:
       throw new Error("Missing or invalid parameter [type]");
    }

    expectObjectOrNull( context, "Missing or invalid parameter [context]" );
    expectDefined( data, "Missing or invalid parameter [data]" );

    this.type = type;
    this.systemId = BOOT_STAMP;
    this.sequenceId = this._generateSequenceId();
    this.at = Date.now(); // OR.. dateTimeString: '2022-08-15T13:03:15.949Z'
    this.context = context || null;

    this.data = data;
  }

  /* ------------------------------------------------------- Internal methods */

  /**
   * Generate a sequence id
   * - Uses boot timestamp and internal counter
   */
  _generateSequenceId()
  {
    return String(sequenceCounter++);

    // return (sequenceCounter++).toString(36); // encoded as base36

    // let countBase36 = (sequenceCounter++).toString(36); // base36

    // return `${BOOT_STAMP}.${countBase36}`;
  }

} // end class