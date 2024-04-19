/**
 * LogBase.js
 *
 * @description
 * This file contains a class that can be extended by other classes to add log
 * functionality to the class
 *
 * @example
 *
 *   import LogBase from "./LogBase.js";
 *
 *   class MyClass extends LogBase
 *   {
 *     ...
 *
 *    myMethod()
 *    {
 *      this.log.debug("My method was called");
 *    }
 *   }
 */

/* ------------------------------------------------------------------ Imports */

import { systemLog } from '@hkd-base/helpers/log.js';

import LogStream from '@hkd-base/classes/LogStream.js';

/* ---------------------------------------------------------------- Internals */

/* ------------------------------------------------------------------ Exports */

export default class LogBase
{
  /**
   * Constructor
   */
  constructor()
  {
    this.log = new LogStream( { className: this.constructor.name } );

    this.log.sendTo( systemLog );
  }

} // end class
