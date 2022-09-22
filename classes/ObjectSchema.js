
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

  _required = [];   // list of required keys

  _keys = {};

  _allowUnknown = false;
  _stripUnknown = false;

  // _breakOnFirstError = true;

  /**
   * Construct an ObjectSchema instance
   *
   * @param {object} properties
   *   Object that contains key => ObjectSchema~Property entries
   *
   * @param {object} options
   *
   * --
   *
   * @eg
   *
   * properties =
   *   {
   *     name: { type: TYPE_STRING },
   *     age: { type: TYPE_NUMBER }
   *   }
   *
   */
  constructor( properties, options={} )
  {
    // == Process properties

    expectObject( properties, "Missing or invalid parameter [properties]" );

    for( let key in properties )
    {
      const property = properties[ key ];

      expectObject( property,
        `Invalid parameter [properties]. Property [${key}] is not an object`);

      const parser = parsers[ property.type ];

      if( !parser )
      {
        if( typeof property.type === "string" )
        {
          throw new Error(
            `Invalid property [${key}]. ` +
            `No parser found for type [${property.type}]`);
        }
        else {
          throw new Error(
            `Invalid property [${key}]. Missing or invalid property type`);
        }
      }

      if( !property.optional )
      {
        this._required.push( key );
      }

      this._keys[ key ] = property;

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
  // breakOnFirstError( breakOnFirst=true )
  // {
  //   expectBoolean( breakOnFirst, "Invalid parameter [breakOnFirst]" );

  //   this._breakOnFirstError = breakOnFirst;
  // }

  // ---------------------------------------------------------------------------

  /**
   * Validate (and parse) an object
   * - Returns the parsed value (object)
   * - Returns an error or errors of the object validation failed
   *
   * @param {object} obj
   * @param {string} [options.abortEarly]
   *   If true, the validate function will stop on the first error
   *
   * @returns {object} { value [, error] }
   */
  validate( obj, { abortEarly=true }={} )
  {
    expectObject( obj, "Missing or invalid parameter [obj]" );

    const properties = this._schemaProperties;

    let errors = null;

    let missing = new Set( this._required );

    for( const key in obj )
    {
      let { error, value } = this.validateProperty( obj, key );

      if( error )
      {
        const type = properties[ key ].type;

        expectError( error,
          `Parser [${type}] did not return a valid error property` );

        error =
          new Error(
            `Failed to parse value for property [${key}] ` +
            `using parser for type [${type}]`,
            { cause: error } );

        // -- Abort on first error

        if( abortEarly )
        {
          return { error, value: null };
        }

        // -- Collect all errors

        //
        // FIXME: return errors by key? errors = { key: ... };
        //        what is the Joi standard?
        //

        if( !errors )
        {
          errors = [];
        }

        errors.push(
          {
            key,
            value: new Error(
              `Failed to parse value for property [${key}] ` +
              `using parser for type [${type}]`,
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
          error: new Error(
            `Missing property [${missing.values().next().value}]`),
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

  // ---------------------------------------------------------------------------

  /**
   * Validate a single object property
   *
   * @param {object} obj
   * @param {string} key - Name of hte property to validate
   *
   * @returns {object} { value: <*> [, error: <Error>] [, finalValue: <*>] }
   */
  validateProperty( obj, key )
  {
    expectObject( obj, "Missing or invalid parameter [obj]" );

    const properties = this._schemaProperties;

    const originalValue = obj[ key ];

    const property = properties[ key ];

    if( !property )
    {
      if( !this._allowUnknown )
      {
        throw new Error(`Unknown property [${key}] is not allowed`);
      }
      else {
        //
        // Unknown property is allowed => return unchanged
        //
        return { value: originalValue };
      }
    }

    const type = property.type;

    const parser = parsers[ type ];

    const parseOptions = property; // parseOptions === property

    expectFunction( parser,
      `Parser for type [${type}] was not found`);

    const output = parser( originalValue, parseOptions );

    // let { value,
    //       error,
    //       finalValue } = output;

    // console.log("ObjectSchema:validateProperty", obj, key, { error, value } );

    return output;
  }

  // ---------------------------------------------------------------------------

  /**
   * Describe the schema
   * - Trying to keep output identical to [Joi](https://joi.dev)
   */
  describe()
  {
    const description =
      {
        type: "object",
        keys: this._keys

        //
        // @see Joi.describe()
        //
        // flags: { default: '' }
        // rules: [ { name: "email" } ]
        // rules: [
        //  { name: 'trim', args: { enabled: true } },
        //  { name: 'case', args: { direction: 'lower' } }
        // ]
      };

    return description;
  }

  /* ------------------------------------------------------- Internal methods */

} // end class