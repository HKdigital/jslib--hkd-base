/* ------------------------------------------------------------------ Imports */

import { expectNotEmptyString,
         expectObject } from "@hkd-base/helpers/expect.js";

import { getGlobalConfig } from "@hkd-base/helpers/global-config.js";

import { expectValidHttpStatus,
         httpRequest,
         METHOD_GET,
         METHOD_POST } from "@hkd-base/helpers/http.js";

import { decodePayload } from "@hkd-base/helpers/jwt-info.js";

/* ---------------------------------------------------------------- Internals */

/* ------------------------------------------------------------------ Exports */

export const CONFIG_LABEL_DEFAULT_JSON_API = "default-api";

// export const CONFIG_LABEL_AUTH_JSON_API = "auth-api";

// export const CONFIG_LABEL_LIVE_JSON_API = "live-api";

// -----------------------------------------------------------------------------

/**
 * Build an URL object by using `origin` and `apiPrefix` from the specified
 * config and a custom `uri`.
 *
 * @param {string} uri - Custom uri part to append
 *
 * @param {object} config - API Config { origin: <string>, apiPrefix: <string> }
 *
 * @returns {object} URI object
 */
export function buildApiUrl( uri, config )
{
  expectNotEmptyString( uri,
    "Missing or invalid parameter [uri]");

  expectObject( config,
    "Missing or invalid parameter [config]");

  const { origin, apiPrefix="" } = config;

  expectNotEmptyString( origin,
    `Missing or invalid parameter [config.origin]` );

  expectNotEmptyString( apiPrefix,
    `Invalid parameter [config.apiPrefix]` );

  return new URL( apiPrefix + uri, origin );
}

// -----------------------------------------------------------------------------

/**
 * Make GET request to fetch JSON encoded data
 * - Expect JSON response from server
 *
 * @note
 * - If the global config contains `includeSessionId=true`,
 *   an HTTP header [x-session-id] will be included in the request.
 *
 * - If the global config contains `jwt`, that token will be set as HTTP
 *   header [authorization: Bearer <token>].
 *
 * --
 *
 * @param {string} uri - uri of the API method
 *
 * @param {object} [urlSearchParams]
 *   Parameters that should be added to the request url
 *
 * @param {string} [configLabel=CONFIG_LABEL_DEFAULT_JSON_API]
 *   Label of the global config entry that contains information about the
 *   backend
 *
 * @returns {object} { abort, jsonResponsePromise }
 */
export async function jsonApiGet(
  {
    uri,
    urlSearchParams,
    configLabel=CONFIG_LABEL_DEFAULT_JSON_API
  } )
{
  return jsonApiRequest(
    {
      uri,
      urlSearchParams,
      method: METHOD_GET,
      configLabel
    } );
}

// -----------------------------------------------------------------------------

/**
 * Make POST request to send JSON encoded data
 * - Expect JSON response from server
 *
 * @note
 * - If the global config contains `includeSessionId=true`,
 *   an HTTP header [x-session-id] will be included in the request.
 *
 * - If the global config contains `jwt`, that token will be set as HTTP
 *   header [authorization: Bearer <token>].
 *
 * --
 *
 * @param {string} uri - uri of the API method
 *
 * @param {*} body
 *   Data that will be converted to a JSON encoded and send to the server
 *
 * @param {string} [configLabel=CONFIG_LABEL_DEFAULT_JSON_API]
 *   Label of the global config entry that contains information about the
 *   backend
 *
 * @returns {mixed} parsed JSON response from backend server
 */
export async function jsonApiPost(
  {
    uri,
    body=null,
    configLabel=CONFIG_LABEL_DEFAULT_JSON_API
  } )
{
  return jsonApiRequest(
    {
      uri,
      body: JSON.stringify( body ),
      method: METHOD_POST,
      configLabel
    } );
}

// -----------------------------------------------------------------------------

/**
 * Make a request to fetch JSON encoded data from a server
 * - Expects the server to return a JSON encoded response value
 *
 * @note
 * - If the global config contains `includeSessionId=true`,
 *   an HTTP header [x-session-id] will be included in the request.
 *
 * - If the global config contains `jwt`, that token will be set as HTTP
 *   header [authorization: Bearer <token>].
 *
 * --
 *
 * @param {string} uri - uri of the API method
 *
 * @param {string} [configLabel=CONFIG_LABEL_DEFAULT_JSON_API]
 *   Label of the global config entry that contains information about the
 *   backend
 *
 * @returns {mixed} parsed JSON response from backend server
 */
export async function jsonApiRequest(
  {
    uri,
    method,
    urlSearchParams,
    body,
    configLabel=CONFIG_LABEL_DEFAULT_JSON_API
  } )
{
  expectNotEmptyString( uri, "Missing or invalid parameter [uri]" );

  expectNotEmptyString( configLabel, "Invalid parameter [configLabel]" );

  const { origin,
          apiPrefix,
          token,
          /*includeSessionId=false*/ } = getGlobalConfig( configLabel );

  const url = buildApiUrl( uri, { origin, apiPrefix } );

  const headers =
    {
      "accept": "application/json",
      "content-type": "application/json"
    };

  if( token )
  {
    //
    // Check if token has not expired before doing a request
    //
    const decodedToken = decodePayload(token);

    if( "exp" in decodedToken )
    {
      const expiredMs = Date.now() - decodedToken.exp * 1000;

      if( expiredMs > 0 )
      {
        throw new Error(
          `Token from global config [${configLabel}] has expired ` +
          `(${Math.round(expiredMs/1000)} seconds ago)`);
      }
    }

    //
    // Add token as HTTP header
    //
    headers["authorization"] = `Bearer ${token}`;
    // options.headers["authorization"] = `Bearer invalid-token`;
  }

  // urlSearchParams
  // body

  const response =
    await httpRequest( { method, url, body, urlSearchParams, headers } );

  expectValidHttpStatus( response, url );

  let parsedResponse;

  try {
    //
    // @note when security on the client side fails, an `opaque` response
    //       is returned by the browser (empty body) -> parsing fails
    //       (use CORS to fix this)
    //
    parsedResponse = await response.json();
  }
  catch( e )
  {
    // console.log( response );
    throw new Error(
      `Failed to JSON decode server response from [${decodeURI(url.href)}]`);
  }

  if( parsedResponse.error )
  {
    throw new Error( parsedResponse.error );
  }

  return parsedResponse;
}
