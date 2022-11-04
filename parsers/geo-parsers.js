
/* ------------------------------------------------------------------ Imports */

import { TYPE_POSTAL_CODE_OR_PLACE_DUTCH }
  from "@hkd-base/types/schema-types-geo.js";

import { registerParsers } from "@hkd-base/helpers/parse.js";

import { RE_POSTAL_CODE_DUTCH,
         RE_PLACE_DUTCH } from "@hkd-base/constants/regexp.js";

/* ---------------------------------------------------------------- Internals */

let registered = false;

/* ------------------------------------------------------------------ Exports */

export let parsers =
{
  [ TYPE_POSTAL_CODE_OR_PLACE_DUTCH ]: function( value, flags={}, rules=[] )
    {
      if( typeof value !== "string" ) {
        return { error: new Error("Value should be a string") };
      }

      // value = value.toLowerCase();

      const finalValue = value.toLowerCase().trim(); // trim value before test

      if( !RE_POSTAL_CODE_DUTCH.test( finalValue ) &&
          !RE_PLACE_DUTCH.test( finalValue ) )
      {
        return { error: new Error(
          "Value should be a valid dutch postal code or city name") };
      }

      return { value,
               finalValue };
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