
/* ------------------------------------------------------------------ Imports */

import { expectNotEmptyString } from "@hkd-base/helpers/expect.js";

/* ------------------------------------------------------------------ Exports */

/**
 * Decodes the payload of a JSON Web Token
 * - Returns an object that contains the claims of the JWT
 *
 * @note This method does not verify the payload!
 *
 * --
 *
 * @param {string} token - A Json Web Token
 *
 * @returns {object} claims
 */
export function decodePayload( token )
{
  expectNotEmptyString( token, "Missing or invalid parameter [token]" );

  const from = token.indexOf(".");

  if( -1 === from )
  {
    throw new Error(
      "Invalid token, missing [.] token as payload start indicator");
  }

  const to = token.lastIndexOf(".");

  if( to === from )
  {
    throw new Error(
      "Invalid token, missing second [.] token as payload end indicator");
  }

  const payload = token.slice( from + 1, to );

  // console.log( { payload } );

  return JSON.parse( atob( payload ) );
}