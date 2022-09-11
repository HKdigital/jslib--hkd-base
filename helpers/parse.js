
/* ------------------------------------------------------------------ Imports */

import { expectDefined,
         expectObject } from "@hkd-base/helpers/expect.js";

import {
  TYPE_STRING,
  TYPE_NUMBER,
  TYPE_BOOLEAN,
  TYPE_OBJECT,
  TYPE_ARRAY } from "@hkd-base/schemas/schema-types.js";

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
  [ TYPE_STRING ]: function( value, options )
    {
      if( typeof value !== "string" ) {
        return { error: new Error("Value should be a string") };
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
      if( typeof value !== "array" ) {
        return { error: new Error("Value should be an array") };
      }

      return { value };
    },

  // ...
};