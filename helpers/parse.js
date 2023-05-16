
/* ------------------------------------------------------------------ Imports */

import { expectNotEmptyString,
         expectDefined,
         expectObject } from "@hkd-base/helpers/expect.js";

import { tryRegisterDefaultParsers }
  from "@hkd-base/parsers/default-parsers.js";

/* ---------------------------------------------------------------- Internals */

const registeredParsers = {};

/**
 * Register parsers
 *
 * @param {object} _.parsers
 * @param {object} _.overwrite
 */
function registerParsers( { parsers, overwrite=false } )
{
  expectObject( parsers, "Missing or invalid parameter [parsers]" );

  for( const label in parsers )
  {
    registeredParsers[ label ] = parsers[ label ];
  }
}

tryRegisterDefaultParsers();

/* ------------------------------------------------------------------ Exports */

export { registeredParsers };

/**
 * Register parsers
 *
 * @param {object} _.parsers
 * @param {object} _.overwrite
 */
export { registerParsers };

// -----------------------------------------------------------------------------

/**
 * Get a parser function
 * - The parser can be preconfigured with flags and rules
 *
 * @param {string} type - Parser type e.g. TYPE_STRING
 * @param {string} [_.flags]
 * @param {string} [_.rules]
 *
 * @returns {function} parser function
 */
export function getParser( type, { flags, rules }={} )
{
  expectNotEmptyString( type,
    "Missing or invalid parameter [type]" );

  const parser = registeredParsers[ type ];

  if( !parser )
  {
    throw new Error(`No parser found for [type=${type}]`);
  }

  if( flags || (rules && rules.length) )
  {
    const options = {};

    if( flags )
    {
      options.flags = flags;
    }

    if( rules )
    {
      options.rules = rules;
    }

    // Return parser with predefined flags and/or rules

    return ( value ) => {
      return parser( value, options );
    };
  }
  else {
    return parser;
  }
}

// -----------------------------------------------------------------------------

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
 * @returns {object} { value [, error] }
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
