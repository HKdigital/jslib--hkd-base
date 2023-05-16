
/* ------------------------------------------------------------------ Imports */

import { expectNotEmptyString,
         expectObjectPath,
         expectArray,
         expectDefined,
         expectFunction } from "@hkd-base/helpers/expect.js";

import { objectGet,
         objectSet } from "@hkd-base/helpers/object.js";

import { equals } from "@hkd-base/helpers/compare.js";

import { clone } from "@hkd-base/helpers/object.js";

import { toArrayPath } from "@hkd-base/helpers/array.js";

import ValueStore from "@hkd-base/classes/ValueStore.js";

import LogBase from "@hkd-base/classes/LogBase.js";

/* ------------------------------------------------------------- Export class */

export default class Config extends LogBase
{
  data = {};
  events = new ValueStore();

  _parsers = {};

  /**
   * Construct Config instance
   *
   */
  // constructor() { super(...arguments); }

  // ---------------------------------------------------------------------------

  /**
   * Subscribe to configuration updates
   *
   * Configuration events contain the object path (array) of the updated data
   * e.g. { <array> objectPath }
   */
  subscribe()
  {
    return this.events.subscribe( ...arguments );
  }

  // ---------------------------------------------------------------------------

  /**
   * Call all registered unsubscribe functions
   */
  async unsubscribeAll()
  {
    this.events.unsubscribeAll();
  }

  // ---------------------------------------------------------------------------

  /**
   * Set configuration data
   *
   * @param {string} objectPath
   * @param {string[]|string} objectPath
   * @param {*} newValue
   *
   * @param {boolean} [options.triggerEvent=true]
   *   Triggers a "configure event" if true
   */
  set( objectPath, newValue, { triggerEvent=true }={} )
  {
    // this.log.debug( objectPath );

    expectObjectPath( objectPath,
      "Missing or invalid parameter [objectPath]" );

    expectDefined( newValue, "Missing or invalid parameter [newValue]" );

    objectPath = toArrayPath( objectPath );

    if( !objectPath.length )
    {
      throw new Error("Invalid parameter [objectPath] (path is empty)");
    }

    const data = this.data;

    const existingValue = objectGet( data, objectPath );

    if( !equals( existingValue, newValue ) )
    {
      const topLevelPath = objectPath[0];

      //
      // Get and clone existing config data
      //
      let newData = clone( objectGet( data, topLevelPath ) || {} );

      objectSet( newData, objectPath, newValue );

      const parser = this._parsers[ topLevelPath ];

      if( parser )
      {
        try {
          newData = parser( newData[ topLevelPath ] );
        }
        catch(e)
        {
          throw new Error(
            `Failed to parse config [${topLevelPath}]`, { cause: e } );
        }
      }

      objectSet( data, objectPath, newValue );

      if( triggerEvent )
      {
        this.events.set(
          {
            objectPath
          } );
      }
    }
    // else value not changed => nothing to do
  }

  // ---------------------------------------------------------------------------

  /**
   * Get the data at the specified path
   *
   * @param {string} objectPath
   *
   * @returns {object|undefined} data or undefined if not set
   */
  get( objectPath )
  {
    return objectGet( this.data, objectPath, undefined );
  }

  // ---------------------------------------------------------------------------

  /**
   * Set a parser that validates and parses the configuration data that
   * is set under the specified label.
   *
   * @param {string} topLevelPath
   *   topLevelPath is the first path part of an object path of some
   *   configuration data.
   *   Parsers can only be defined for the "top level" configuration paths.
   *
   * @param {function|null} callbackOrNull
   *
   */
  setParser( topLevelPath, callbackOrNull )
  {
    expectNotEmptyString( topLevelPath,
      "Missing or invalid parameter [topLevelPath]" );

    if( null === callbackOrNull )
    {
      delete this._parsers[ topLevelPath ];
    }

    expectFunction( callbackOrNull,
      "Missing or invalid parameter [callbackOrNull]" );

    this._parsers[ topLevelPath ] = callbackOrNull;
  }

  // ---------------------------------------------------------------------------

  /**
   * Expect a not empty array path
   *
   * @param {string[]} arrayObjectPath
   */
  expectNotEmptyArrayObjectPath( arrayObjectPath )
  {
    expectArray( arrayObjectPath,
      "Invalid parameter [arrayObjectPath]" );

    const n = arrayObjectPath.length;

    if( 0 === n )
    {
      throw new Error("Invalid parameter [objectPath] (path is empty)");
    }

    for( let j = 0; j < n; j = j + 1 )
    {
      const current = arrayObjectPath[j];

      if( typeof current !== "string" || !current.length )
      {
        throw new Error(
          "Invalid [arrayObjectPath] " +
          "(should only contain not-emtpy strings)");
      }
    }
  }

  /* ------------------------------------------------------- Internal methods */


} // end class