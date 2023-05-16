
/* ------------------------------------------------------------------ Imports */

import { TYPE_POSTCODE_DUTCH,
         TYPE_POSTCODE_OR_PLACE_DUTCH }
  from "@hkd-base/types/schema-types-geo.js";

import { registerParsers } from "@hkd-base/helpers/parse.js";

import { RE_POSTCODE_DUTCH,
         RE_PLACE_DUTCH } from "@hkd-base/constants/regexp.js";

/* ---------------------------------------------------------------- Internals */

let registered = false;

/* ------------------------------------------------------------------ Exports */

export let parsers =
{
  [ TYPE_POSTCODE_DUTCH ]: function( value, flags={}, rules=[] )
    {
      if( typeof value !== "string" ) {
        return { error: new Error("Value should be a string") };
      }

      const finalValue = value.toUpperCase().trim(); // trim value before test

      if( !RE_POSTCODE_DUTCH.test( finalValue ) )
      {
        return { error: new Error(
          "Value should be a valid dutch postcode") };
      }

      return { value,
               finalValue };
    },

  [ TYPE_POSTCODE_OR_PLACE_DUTCH ]: function( value, flags={}, rules=[] )
    {
      if( typeof value !== "string" ) {
        return { error: new Error("Value should be a string") };
      }

      // value = value.toLowerCase();

      let finalValue = value.trim(); // trim value before test

      if( RE_POSTCODE_DUTCH.test( finalValue ) )
      {
        return { value,
                 finalValue: finalValue.toUpperCase() };
      }
      else if( RE_PLACE_DUTCH.test( finalValue.toLowerCase() ) )
      {
        return { value,
                 finalValue: finalValue.toLowerCase() };
      }
      else {
        return { error: new Error(
          "Value should be a valid dutch postcode or city name") };
      }
    }
};

// -----------------------------------------------------------------------------

/**
 * Add the parsers from this file to the list of parsers that can be used by
 * the parse function
 */
export function tryRegisterGeoParsers()
{
  if( !registered )
  {
    registerParsers( { parsers } );

    registered = true;
  }
}