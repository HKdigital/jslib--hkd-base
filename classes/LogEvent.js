
/* ------------------------------------------------------------------ Imports */

import { DEBUG, INFO, WARNING, ERROR } from "@hkd-base/types/log-types.js";

import { BOOT_STAMP } from "@hkd-base/helpers/unique.js";

let eventCounter = 1;

/* ------------------------------------------------------------- Export class */

export default class LogEvent
{
  /**
   * Construct an LogEvent instance
   *
   * @param {string} [type=DEBUG|ERROR]
   * @param {object} [context=null]
   *
   * @param {data} data
   *   Event data, can be a message, an object or an Error object. If the
   *   data is an Error object, the event type is changed to Error
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

    this.type = type;
    this.id = this._generateId();
    this.at = Date.now();
    this.context = context || null;

    this.data = data;
  }

  /* ------------------------------------------------------- Internal methods */

  /**
   * Generate id
   * - Uses boot timestamp and internal counter
   */
  _generateId()
  {
    let counterValue = (eventCounter++).toString(36); // base36

    return `${BOOT_STAMP}:${counterValue}`;
  }

} // end class