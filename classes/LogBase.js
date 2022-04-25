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

import log from "../log.js";

/* ---------------------------------------------------------------- Internals */

/* ------------------------------------------------------------------ Exports */

export default class LogBase
{
  /**
   * Constructor
   */
  constructor()
  {
    this.__logContext = { className: this.constructor.name };

    const self = this;

    this.log =
      {
        debug: function() {
          const event =
            log.createEvent( log.DEBUG, arguments, self.__logContext );

          log.event( event );
        },

        info: function()  {
          const event =
            log.createEvent( log.INFO, arguments, self.__logContext );

          log.event( event );
        },

        warning: function()  {
          const event =
            log.createEvent( log.WARNING, arguments, self.__logContext );

          log.event( event );
        },

        error: function()  {
          const event =
            log.createEvent( log.ERROR, arguments, self.__logContext );

          log.event( event );
        }
      };
  }

} // end class
