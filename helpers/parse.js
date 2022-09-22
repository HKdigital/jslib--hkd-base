
/* ------------------------------------------------------------------ Imports */

import { expectString,
         expectNotEmptyString,
         expectPositiveNumber,
         expectDefined,
         expectObject } from "@hkd-base/helpers/expect.js";

import {
  TYPE_STRING,
  TYPE_NUMBER,
  TYPE_BOOLEAN,
  TYPE_OBJECT,
  TYPE_ARRAY,
  TYPE_NAME,
  TYPE_EMAIL } from "@hkd-base/types/schema-types.js";

import { RE_NAME,
         RE_EMAIL,
         RE_MULTIPLE_SPACES } from "@hkd-base/constants/regexp.js";

/* ---------------------------------------------------------------- Internals */

const rulesByName =
  {
    /**
     * Remove leading and trailing whitespace from a string
     *
     * @param {string} value
     *
     * @returns {object} { value }
     */
    trim: ( value ) =>
      {
        expectString( value, "Missing or invalid parameter [value]" );

        return { value: value.trim() };
      },

    /**
     * Convert string to lowercase
     *
     * @param {string} value
     *
     * @returns {object} { value }
     */
    lowercase: ( value ) =>
      {
        expectString( value, "Missing or invalid parameter [value]" );

        return { value: value.toLowerCase() };
      },

    /**
     * Convert string to uppercase
     *
     * @param {string} value
     *
     * @returns {object} { value }
     */
    uppercase: ( value ) =>
      {
        expectString( value, "Missing or invalid parameter [value]" );

        return { value: value.toUpperCase() };
      },

    /**
     * Replace duplicate white space by single space
     *
     * @param {string} value
     *
     * @returns {object} { value }
     */
    singleSpaces: ( value ) =>
      {
        expectString( value, "Missing or invalid parameter [value]" );

        value.replace( RE_MULTIPLE_SPACES, ' ' );

        return { value };
      },

    /**
     * Check for minimum string length
     *
     * @param {string} value
     * @param {number} options.limit - minimum string length
     *
     * @returns {object} { value [,error] }
     */
    min: ( value, { limit=0 }={} ) =>
      {
        expectString( value, "Missing or invalid parameter [value]" );

        expectPositiveNumber( limit,
          "Missing or invalid parameter [limit]" );

        if( value.length < limit )
        {
          return {
            error: new Error(
              `Length should be equal or larger than [${limit}]`)
          };
        }

        return { value };
      }
  };

/* ------------------------------------------------------------------ Exports */

/**
 * Parse a value using a schema
 *
 * A schema should have a `validate` method that returns an
 * object: { error, value }.
 *
 * The data validator (Joi)[https://joi.dev/] can be used to build schemas,
 * but any other schema that implements the validate method can be used too.
 *
 * The simple data validator `ObjectScheme.js` from
 * (jslib--hkd-base)[https://github.com/HKdigital/jslib--hkd-base] can also
 * be used.
 *
 * --
 *
 * Joi can be linked from a CDN, e.g.
 * [CDN Joi-browser](https://cdn.jsdelivr.net/npm/joi-browser@13.4.0/dist/joi-browser.min.js)
 *
 * @see [Joi](https://joi.dev)
 *
 * Enjoi can be used to convert JSON to Joi schemes
 * (CDN Enjoi-browser)[https://cdn.jsdelivr.net/npm/enjoi-browser@1.2.0/dist/enjoi.min.js]
 *
 * @see [Enjoi](https://github.com/tlivings/enjoi)
 *
 * --
 *
 * @param {object} schema - Schema, e.g. a Joi schema
 * @param {function} schema.validate
 *   A function that returns and object { error: <Error>, value: <*> }
 *
 * @param {*} value
 *
 * @returns {*} parsed value
 */
export function parse( schema, value )
{
  expectObject( schema, "Missing or invalid parameter [schema]" );
  expectDefined( value, "Missing or invalid parameter [value]" );

  const { error,
          value: parsedValue } = schema.validate( value );

  if( error )
  {
    throw error;
  }

  return parsedValue;
}

// -----------------------------------------------------------------------------

/**
 * Object that contains parser functions
 */
export const parsers =
{
  [ TYPE_STRING ]: function( value, flags={}, rules=[] )
    {
      //
      // TODO parse options (to check if options are valid)
      //

      if( undefined === value )
      {
        if( "default" in flags )
        {
          return flags.default;
        }
      }

      if( typeof value !== "string" ) {
        return { error: new Error("Value should be a string") };
      }

      for( const rule of rules )
      {
        const name = rule.name;

        expectNotEmptyString( name,
          "Invalid rule, invalid property [name]" );

        const ruleFn = rulesByName[ name ];

        if( !ruleFn )
        {
          throw new Error(`Rule [${name}] does not exist`);
        }

        const output = ruleFn( value, rule );

        if( output.error )
        {
          return output;
        }
        else if( output.value ) {
          value = output.value;
        }

      } // end for

      return { value };
    },

  [ TYPE_NAME ]: function( value, options )
  {
    if( typeof value !== "string" ) {
      return { error: new Error("Value should be a string") };
    }

    const finalValue = value.trim(); // trim value before test

    if( !RE_NAME.test( finalValue ) )
    {
      return { error: new Error("Value should be a valid 'name'") };
    }

    //
    // @note trimEnd() not possible while typing e.g. fullname
    //       because typing spaces between names is not possible
    //
    value = value.trimStart();

    return { value, finalValue };
  },

  [ TYPE_EMAIL ]: function( value, options )
  {
    // return { error: new Error("Test failure") };

    if( typeof value !== "string" ) {
      return { error: new Error("Value should be a string") };
    }

    value = value.trim().toLowerCase();

    if( !RE_EMAIL.test( value ) )
    {
      return { error: new Error("Value should be a valid e-mail address") };
    }

    return { value };
  },

  [ TYPE_NUMBER ]: function( value, options )
    {
      if( typeof value !== "number" ) {
        return { error: new Error("Value should be a number") };
      }

      return { value };
    },

  [ TYPE_BOOLEAN ]: function( value, options )
    {
      if( typeof value !== "boolean" ) {
        return { error: new Error("Value should be a boolean") };
      }

      return { value };
    },

  [ TYPE_OBJECT ]: function( value, options )
    {
      if( typeof value !== "object" || value === null ) {
        return { error: new Error("Value should be an object") };
      }

      return { value };
    },

  [ TYPE_ARRAY ]: function( value, options )
    {
      if( !Array.isArray(value) ) {
        return { error: new Error("Value should be an array") };
      }

      return { value };
    },

  // ...
};