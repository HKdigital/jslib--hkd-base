
/* ------------------------------------------------------------------ Imports */

import { expectString,
         expectNotEmptyString,
         expectPositiveNumber } from "@hkd-base/helpers/expect.js";

import {
  TYPE_STRING,
  TYPE_NUMBER,
  TYPE_BOOLEAN,
  TYPE_OBJECT,
  TYPE_ARRAY,
  TYPE_NAME,
  TYPE_FANTASY_NAME,
  TYPE_EMAIL } from "@hkd-base/types/schema-types.js";

import { RE_NAME,
         RE_FANTASY_NAME,
         RE_EMAIL,
         RE_MULTIPLE_SPACES } from "@hkd-base/constants/regexp.js";

import { registerParsers } from "@hkd-base/helpers/parse.js";

/* ---------------------------------------------------------------- Internals */

let registered = false;

/* ------------------------------------------------------------------ Exports */

/**
 * Rules can be used in a schema
 *
 * e.g.
 *
 * let schema =
 *  {
 *    name:
 *      { type: TYPE_STRING,
 *        rules: [ { name: "trim" },
 *                 { name: "min", limit: 2 } ]
 *      }
 *  }
 */
export const rulesByName =
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

// ---------------------------------------------------------------------------

/**
 * Object that contains parser functions
 */
export const parsers =
  {
    [ TYPE_STRING ]: function( value, { flags={}, rules=[] }={} )
      {
        //
        // TODO parse options (to check if options are valid)
        //

        // console.log( "flags", flags );
        // console.log( "rules", rules );

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

        let finalValue = value;

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

          const output = ruleFn( finalValue, rule );

          if( output.error )
          {
            return output;
          }
          else if( output.finalValue )
          {
            finalValue = output.finalValue;
          }

        } // end for

        return { value, finalValue };
      },

    [ TYPE_NAME ]: function( value /* , { flags={}, rules=[] }={} */ )
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

    [ TYPE_FANTASY_NAME ]: function( value /* , { flags={}, rules=[] }={} */ )
    {
      if( typeof value !== "string" ) {
        return { error: new Error("Value should be a string") };
      }

      const finalValue = value.trim(); // trim value before test

      if( !RE_FANTASY_NAME.test( finalValue ) )
      {
        return { error: new Error("Value should be a valid 'fantasy name'") };
      }

      //
      // @note trimEnd() not possible while typing e.g. fullname
      //       because typing spaces between names is not possible
      //
      value = value.trimStart();

      return { value, finalValue };
    },

    [ TYPE_EMAIL ]: function( value /* , { flags={}, rules=[] }={} */ )
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

    [ TYPE_NUMBER ]: function( value /* , { flags={}, rules=[] }={} */ )
      {
        if( typeof value !== "number" ) {
          return { error: new Error("Value should be a number") };
        }

        return { value };
      },

    [ TYPE_BOOLEAN ]: function( value /* , { flags={}, rules=[] }={} */ )
      {
        if( typeof value !== "boolean" ) {
          return { error: new Error("Value should be a boolean") };
        }

        return { value };
      },

    [ TYPE_OBJECT ]: function( value /* , { flags={}, rules=[] }={} */ )
      {
        if( typeof value !== "object" || value === null ) {
          return { error: new Error("Value should be an object") };
        }

        return { value };
      },

    [ TYPE_ARRAY ]: function( value /* , { flags={}, rules=[] }={} */ )
      {
        if( !Array.isArray(value) ) {
          return { error: new Error("Value should be an array") };
        }

        return { value };
      },

    // ...
  };

// -----------------------------------------------------------------------------

/**
 * Add the parsers from this file to the list of parsers that can be used by
 * the parse function
 */
export function tryRegisterDefaultParsers()
{
  if( !registered )
  {
    registerParsers( { parsers } );

    registered = true;
  }
}