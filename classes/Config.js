
/* ------------------------------------------------------------------ Imports */

import { expectNotEmptyString,
         expectObjectPath,
         expectObject,
         expectArray,
         expectDefined,
         expectFunction }
  from "@hkd-base/helpers/expect.js";

import { objectGet,
         objectSet }
  from "@hkd-base/helpers/object.js";

import { equals }
  from "@hkd-base/helpers/compare.js";

import { clone }
  from "@hkd-base/helpers/object.js";

import { toArrayPath }
  from "@hkd-base/helpers/array.js";

import ValueStore
  from "@hkd-base/classes/ValueStore.js";

import LogBase
  from "@hkd-base/classes/LogBase.js";

import ObjectSchema
  from "@hkd-base/classes/ObjectSchema.js";

/* ------------------------------------------------------------- Export class */

export default class Config extends LogBase
{
  data = {};
  events = new ValueStore();

  _parsers = {};
  _schema;

  /**
   * Construct Config instance
   *
   * @param {object} schemaOrSchemaProperties
   *   Schema (instanceof ObjectSchema) or object that contains schema
   *   properties
   */
  constructor( schemaOrSchemaProperties )
  {
    super(...arguments);

    // -- Store schema if supplied

    if( schemaOrSchemaProperties )
    {
      expectObject( schemaOrSchemaProperties,
        "Missing or invalid parameter [schemaOrSchemaProperties]" );

      if( !(schemaOrSchemaProperties instanceof ObjectSchema) )
      {
        schemaOrSchemaProperties =
          new ObjectSchema( schemaOrSchemaProperties );
      }
    }
  }

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
   *   DEPRECEATED:
   *   Triggers a "configure event" if true
   *
   * @param {string|Symbol} [options.triggeredBy]
   *   Specify a `triggeredBy` property that will be supplied to the event
   *   subscribers. This can be used to `break` loops created by code that both
   *   sets configuration data and subscribes to configuration data changes
   */
  set( objectPath, newValue, { triggerEvent=true, triggeredBy }={} )
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
        //
        // A parser validates a single `topLevel` property
        //
        try {
          newData = parser( newData );

          if( 1 === objectPath.length )
          {
            newValue = newData;
          }
          else {
            newValue = objectGet( newData || {}, objectPath, null );
          }
        }
        catch(e)
        {
          throw new Error(
            `Failed to parse config [${topLevelPath}]`, { cause: e } );
        }
      }
      else if( this._schema )
      {
        //
        // Use the schema to validate the
        //
        const { // value,
                finalValue,
                error } =
          this._schema.validateProperty( newData, topLevelPath );

        if( error )
        {
          throw new Error(
            `Failed to parse config [${topLevelPath}]`, { cause: error } );
        }

        newData = finalValue;

        newValue = objectGet( newData, objectPath );
      }

      objectSet( data, objectPath, newValue );

      if( triggeredBy )
      {
        this.events.set(
          {
            objectPath,
            triggeredBy
          } );
      }
      else if ( triggerEvent )
      {
        //
        // DEPRECEATED
        //
        this.events.set(
          {
            objectPath
          } );
      }

      return { updated: true, newValue };
    }
    // else value not changed => nothing to do

    return { updated: false, newValue };
  }

  // ---------------------------------------------------------------------------

  // clear( { triggeredBy }={} )
  // {
  // }

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
   * Get the data at the top level path of the specified object path
   * as key-value pair
   *
   * @returns {{ key: string, value: * }}
   */
  getTopLevelKeyValue( objectPath )
  {
    const key = this.getTopLevelPath( objectPath );
    const value = this.get( key );

    return { key, value };
  }

  // ---------------------------------------------------------------------------

  /**
   * Get the top level path of an object path
   * - The top level
   *
   * @param {string} objectPath
   *
   * @returns {string} top level path
   */
  getTopLevelPath( objectPath )
  {
    expectObjectPath( objectPath,
      "Missing or invalid parameter [objectPath]" );

    objectPath = toArrayPath( objectPath );

    if( !objectPath.length )
    {
      throw new Error("Invalid parameter [objectPath] (path is empty)");
    }

    return objectPath[0];
  }

  // ---------------------------------------------------------------------------

  /**
   * Get the value at the root path of the specified object path
   *
   * @param {string} objectPath
   *
   * @returns {*} data or undefined if not set
   */
  getValueAtTopLevelPath( objectPath )
  {
    expectObjectPath( objectPath,
      "Missing or invalid parameter [objectPath]" );

    objectPath = toArrayPath( objectPath );

    if( !objectPath.length )
    {
      throw new Error("Invalid parameter [objectPath] (path is empty)");
    }

    const topLevelPath = objectPath[0];

    return this.data[ topLevelPath ];
  }

  // ---------------------------------------------------------------------------

  /**
   * Get the data at the specified path
   * - Throws an error if no value has been defined
   *
   * @param {string} objectPath
   *
   * @throws data not defined
   *
   * @returns {object|undefined} data or undefined if not set
   */
  getDefined( objectPath )
  {
    const value = objectGet( this.data, objectPath, undefined );

    if( undefined === value )
    {
      throw new Error(`Config value [${objectPath}] has not been set`);
    }

    return value;
  }

  // ---------------------------------------------------------------------------

  /**
   * Get the data at the specified path
   * - Throws an error if the value is empty
   *
   * @param {string} objectPath
   *
   * @returns {object|undefined} data or undefined if not set
   */
  getNotEmpty( objectPath )
  {
    const value = objectGet( this.data, objectPath, undefined );

    if( !value )
    {
      throw new Error(`Config value [${objectPath}] is empty`);
    }

    return value;
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