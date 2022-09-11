
/* ------------------------------------------------------------------ Imports */

import { expectBoolean,
         expectObject,
         expectFunction,
         expectError } from "@hkd-base/helpers/expect.js";

import { parsers } from "@hkd-base/helpers/parse.js";

/* ---------------------------------------------------------------- Internals */

/* ------------------------------------------------------------- Export class */

/**
 * @typedef {Object} ObjectSchema~Property
 * @property {string} type
 */

export default class ObjectSchema
{
  _schemaProperties = {};

  _required = [];

  _allowUnknown = false;
  _stripUnknown = false;

  _breakOnFirstError = true;

  /**
   * Construct an ObjectSchema instance
   *
   * @param {object} properties
   *   Object that contains key => ObjectSchema~Property entries
   *
   * @param {object} options
   */
  constructor( properties, options={} )
  {
    // == Process properties

    expectObject( properties, "Missing or invalid parameter [properties]" );

    for( let key in properties )
    {
      const value = properties[ key ];

      expectObject( value,
        `Invalid parameter [properties]. Property [${key}] is not an object`);

      if( !parsers[ value.type ] )
      {
        if( typeof value.type === "string" )
        {
          throw new Error(
            `Invalid property [${key}]. No parser found for type [${value.type}]`);
        }
        else {
          throw new Error(
            `Invalid property [${key}]. Missing or invalid property type`);
        }
      }

      if( !value.optional )
      {
        this._required.push( key );
      }

    } // end for

    this._schemaProperties = properties;

    // == Process options

    if( options )
    {
      expectObject( options, "Invalid parameter [options]" );

      if( "allowUnknown" in options )
      {
        this.allowUnknown( options.allowUnknown );
      }

      if( "stripUnknown" in options )
      {
        this.stripUnknown( options.stripUnknown );
      }
    }

  }

  // ---------------------------------------------------------------------------

  /**
   * Specifiy if the object may have undefined properties
   *
   * @param {boolean} [allow=true]
   */
  allowUnknown( allow=true )
  {
    expectBoolean( allow, "Invalid parameter [allow]" );

    this._allowUnknown = allow;
  }

  // ---------------------------------------------------------------------------

  /**
   * Specifiy if unknown properties should be stripped from the parsed object
   *
   * @param {boolean} [strip=true]
   */
  stripUnknown( strip=true )
  {
    expectBoolean( strip, "Invalid parameter [strip]" );

    this._stripUnknown = strip;
  }

  // ---------------------------------------------------------------------------

  /**
   * Specifiy if the parser should break on the first error or parse all
   * properties.
   *
   * @param {boolean} [breakOnFirst=true]
   */
  breakOnFirstError( breakOnFirst=true )
  {
    expectBoolean( breakOnFirst, "Invalid parameter [breakOnFirst]" );

    this._breakOnFirstError = breakOnFirst;
  }

  // ---------------------------------------------------------------------------

  /**
   * Validate (and parse) an object
   *
   * @param {object} obj
   *
   * @returns {object} { error, value }
   */
  validate( obj )
  {
    expectObject( obj, "Missing or invalid parameter [obj]" );

    const properties = this._schemaProperties;

    let errors = null;

    let missing = new Set( this._required );

    for( const key in obj )
    {
      const originalValue = obj[ key ];

      const property = properties[ key ];

      if( !property )
      {
        if( !this._allowUnknown )
        {
          throw new Error(`Unknown property [${key}] is not allowed`);
        }
      }

      const type = property.type;

      const parser = parsers[ type ];

      expectFunction( parser,
        `Parser for type [${type}] was not found`);

      let { error, value } = parser( originalValue );

      if( error )
      {
        expectError( error,
          `Parser [${type}] did not return a valid error property` );

        error =
          new Error(
            `Failed to parse value for property [${key}] using parser [${type}]`,
            { cause: error } );

        // -- Break on first error

        if( this._breakOnFirstError )
        {
          return { error, value: null };
        }

        // -- Collect all errors

        if( !errors )
        {
          errors = [];
        }

        errors.push(
          {
            key,
            value: new Error(
              `Failed to parse value for property [${key}] ` +
              `using parser [${type}]`,
              { cause: error } )
          } );
      }

      // -- Parsing was ok: update value

      obj[ key ] = value;

      // -- Keep track of `missing required properties`

      missing.delete( key );

    } // end for

    if( missing.size )
    {
      if( 1 === missing.size )
      {
        return {
          error: new Error(`Missing property [${missing.values()[0]}]`),
          value: null
        };
      }
      else {
        const str = Array.from( missing.values() ).join(", ");

        return {
          error: new Error(`Missing properties [${str}]`),
          value: null
        };
      }
    }

    if( errors )
    {
      return {
        error: new Error(`Encountered [${errors.length}] parse errors`),
        errors, /* <- additional property */
        value: null };
    }

    // -- Parsing was ok: return parsed object

    return { value: obj  };
  }

  /* ------------------------------------------------------- Internal methods */

} // end class