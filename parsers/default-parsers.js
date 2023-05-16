
/* ------------------------------------------------------------------ Imports */

import { expectString,
         expectNotEmptyString,
         expectNumber,
         expectPositiveNumber,
         expectObject } from "@hkd-base/helpers/expect.js";

import {
  TYPE_STRING,
  TYPE_NUMBER,
  TYPE_BOOLEAN,
  TYPE_OBJECT,
  TYPE_ARRAY,
  TYPE_NAME,
  TYPE_FANTASY_NAME,
  TYPE_EMAIL,
  TYPE_PHONE } from "@hkd-base/types/schema-types.js";

import { RE_NAME,
         RE_FANTASY_NAME,
         RE_EMAIL,
         RE_PHONE,
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
 *                 { name: "length", min: 2 } ]
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
     * Check for minimum or maximum string or array length
     *
     * @param {string|array} value
     * @param {number} [options.min] - minimum string length
     * @param {number} [options.max] - maximum string length
     *
     * @returns {object} { value [,error] }
     */
    length: ( value, { min, max }={} ) =>
      {
        if( value === undefined || value.length === undefined )
        {
          throw new Error("Missing or invalid parameter [value]");
        }

        if( min !== undefined )
        {
          expectPositiveNumber( min,
            "Missing or invalid parameter [min]" );

          if( value.length < min )
          {
            return {
              error: new Error(
                `Length should be equal or larger than [${min}]`)
            };
          }
        }

        if( max !== undefined )
        {
          expectPositiveNumber( max,
            "Missing or invalid parameter [max]" );

          if( value.length > max )
          {
            return {
              error: new Error(
                `Length should be smaller or equal to [${max}]`)
            };
          }
        }

        return { value };
      },

    /**
     * Check if the number is within the specified range
     *
     * @param {number} value
     * @param {number} [options.min] - minimum string length
     * @param {number} [options.max] - maximum string length
     *
     * @returns {object} { value [,error] }
     */
    range: ( value, { min, max }={} ) =>
      {
        expectNumber( value,
          "Missing or invalid parameter [value]" );

        // console.log("check range", { value, min, max } );

        if( min !== undefined )
        {
          expectPositiveNumber( min,
            "Missing or invalid parameter [min]" );

          if( value < min )
          {
            return {
              error: new Error(
                `Value should be equal or larger than [${min}]`)
            };
          }
        }

        if( max !== undefined )
        {
          expectPositiveNumber( max,
            "Missing or invalid parameter [max]" );

          if( value > max )
          {
            return {
              error: new Error(
                `Value should be smaller or equal to [${max}]`)
            };
          }
        }

        return { value };
      },

    /**
     * Check if the object has keys
     *
     * @param {number} value
     * @param {number} [options.truthyValues]
     *   If true, all property values must be truthy
     *   - If set to true, the value may not be false, null, 0 or an empty
     *     string
     *
     * @returns {object} { value [,error] }
     */
    hasKeys: ( value, { truthyValues=false } ) =>
    {
      expectObject( value,
        "Missing or invalid parameter [value]" );

      for( const key in value )
      {
        if( !truthyValues || value[ key ] )
        {
          //
          // truthyValues not set or value is truthy
          //
          return { value };
        }
      }

      // No keys found

      return {
        error: new Error( `Value (object) should have at least one key`)
      };
    }

  };

// ---------------------------------------------------------------------------

/**
 * Apply rules to a value and return a finalValue
 *
 * @param {*} _.value
 * @param {} _.rules
 *
 * @returns {object} { value, finalValue [, error] }
 */
export function applyRules( { value, rules } )
{
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
  }

  return { value, finalValue };
}

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

        if( typeof value !== "string" )
        {
          return { error: new Error("Value should be a string") };
        }

        return applyRules( { value, rules } );
      },

    [ TYPE_NAME ]: function( value /* , { flags={}, rules=[] }={} */ )
    {
      if( typeof value !== "string" )
      {
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
      if( typeof value !== "string" )
      {
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

      if( typeof value !== "string" )
      {
        return { error: new Error("Value should be a string") };
      }

      value = value.trim().toLowerCase();

      if( !RE_EMAIL.test( value ) )
      {
        return { error: new Error("Value should be a valid e-mail address") };
      }

      return { value };
    },

    [ TYPE_PHONE ]: function( value, { flags={} /*, rules=[]*/ }={} )
    {
      if( !value && flags.presence === "optional" )
      {
        // Phone number is optional
        return { value: null };
      }

      if( typeof value !== "string" )
      {
        return { error: new Error("Value should be a string") };
      }

      // value = value.trim().toLowerCase();

      if( !RE_PHONE.test( value ) )
      {
        return { error: new Error("Value should be a valid phone number") };
      }

      return { value };
    },

    [ TYPE_NUMBER ]: function( value, { flags={}, rules=[] }={} )
      {
        if( undefined === value )
        {
          if( "default" in flags )
          {
            return flags.default;
          }
        }

        if( typeof value !== "number" ) {
          return { error: new Error("Value should be a number") };
        }

        return applyRules( { value, rules } );
      },

    [ TYPE_BOOLEAN ]: function( value /* , { flags={}, rules=[] }={} */ )
      {
        if( typeof value !== "boolean" ) {
          return { error: new Error("Value should be a boolean") };
        }

        return { value };
      },

    [ TYPE_OBJECT ]: function( value, { flags={}, rules=[] }={} )
      {
        if( typeof value !== "object" || value === null )
        {
          return { error: new Error("Value should be an object") };
        }

        return applyRules( { value, rules } );
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