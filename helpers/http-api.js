/* ------------------------------------------------------------------ Imports */

import { expectString,
         expectNotEmptyString,
         expectObject } from "@hkd-base/helpers/expect.js";

import { ResponseError,
         TokenExpiredError } from "@hkd-base/types/error-types.js";

import { isObject } from "@hkd-base/helpers/is.js";

import { getGlobalConfig } from "@hkd-base/helpers/global-config.js";

import { waitForAndCheckResponse,
         httpRequest,
         METHOD_GET,
         METHOD_POST } from "@hkd-base/helpers/http.js";

import { decodePayload } from "@hkd-base/helpers/jwt-info.js";

/* ---------------------------------------------------------------- Internals */

/* ------------------------------------------------------------------ Exports */

export const KEY_DEFAULT_HTTP_API = "default-http-api";

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

  expectString( apiPrefix,
    `Invalid parameter [config.apiPrefix]` );

  // console.log( { apiPrefix, uri, origin } );

  if( origin )
  {
    const x = origin.indexOf("://");

    if( x !== -1 )
    {
      const y = origin.indexOf( "/", x + 3 );

      if( y !== -1 && origin.length !== y + 1 )
      {
        throw new Error(
          `Invalid parameter [config.origin=${origin}] ` +
          `(should not contain a path)` );
      }
    }
  }

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
 * @param {object|string} [config=KEY_DEFAULT_HTTP_API]
 *   Config parameters or label of the global config entry that contains
 *   the remote API configuration.
 *
 * @returns {object} { abort, jsonResponsePromise }
 */
export async function httpApiGet(
  {
    uri,
    urlSearchParams,
    config=KEY_DEFAULT_HTTP_API
  } )
{
  return httpApiRequest(
    {
      uri,
      urlSearchParams,
      method: METHOD_GET,
      config
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
 * @param {object|string} [config=KEY_DEFAULT_HTTP_API]
 *   Config parameters or label of the global config entry that contains
 *   the remote API configuration.
 *
 * @returns {mixed} parsed JSON response from backend server
 */
export async function httpApiPost(
  {
    uri,
    body=null,
    config=KEY_DEFAULT_HTTP_API
  } )
{
  return httpApiRequest(
    {
      uri,
      body: JSON.stringify( body ),
      method: METHOD_POST,
      config
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
 * @param {object|string} [config=KEY_DEFAULT_HTTP_API]
 *   Config parameters or label of the global config entry that contains
 *   the remote API configuration.
 *
 * --
 *
 * @throws {ResponseError}
 *
 *   A ResponseError will be thrown if:
 *     - A network error occurs
 *     - When the response status is 403, 404 or 500 or not `response.ok`
 *     - The "JSON" response could not be decoded
 *     - The response contains a not-empty error property
 *     - Something else went wrong
 *
 * @throws {TypeError}
 *
 *   --> TODO check if this is not caught and converted into a ResponseError <--
 *
 *   A TypeError will be throw if the internal call to `fetch` fails due to:
 *     - A network error
 *     - Misconfigured CORS on the server side
 *
 * --
 *
 * @returns {mixed} response data: parsed JSON response from backend server
 */
export async function httpApiRequest(
  {
    uri,
    method,
    urlSearchParams,
    body,
    headers,
    config=KEY_DEFAULT_HTTP_API
  } )
{
  expectNotEmptyString( uri, "Missing or invalid parameter [uri]" );

  if( !isObject( config ) )
  {
    expectNotEmptyString( config, "Invalid parameter [config]" );

    config = getGlobalConfig( config );
  }

  const { origin,
          apiPrefix,
          token,
          /*includeSessionId=false*/ } = config;

  const url = buildApiUrl( uri, { origin, apiPrefix } );

  if( !headers )
  {
    headers =
    {
      /* Added `accept "text/html"` to prevent 406 Not Acceptable issues */
      "accept": "text/html,application/json",
      "content-type": "application/json"
    };
  }
  else {
    expectObject( headers,
      "Missing or invalid parameter [headers]" );
  }

  if( token )
  {
    //
    // A JSON Web Token should be used for authentication
    //

    //
    // Check if token has not expired before doing a request
    //
    const decodedToken = decodePayload(token);

    if( "exp" in decodedToken )
    {
      const expiredMs = Date.now() - decodedToken.exp * 1000;

      if( expiredMs > 0 )
      {
        throw new TokenExpiredError(
          `Token has expired (${Math.round(expiredMs/1000)} seconds ago)`);
      }
    }

    //
    // Add token as HTTP header
    //
    headers["authorization"] = `Bearer ${token}`;
  }

  // console.log( "json-api", { method, url, body, urlSearchParams, headers } );

  const responsePromise =
    httpRequest( { method, url, body, urlSearchParams, headers } );

  /**/
  const response = await waitForAndCheckResponse( responsePromise, url );

  let contentType;

  for( let [ key, value ] of response.headers )
  {
    if( key === "content-type" )
    {
      const x = value.indexOf(";");

      if( x === -1 )
      {
        contentType = value;
      }
      else {
        contentType = value.slice( 0, x );
      }
      break;
    }
  }

  let parsedResponse;

  try {
    //
    // @note when security on the client side fails, an `opaque` response
    //       is returned by the browser (empty body) -> parsing fails
    //       (use CORS to fix this)
    //

    switch( contentType )
    {
      case "application/json":
        parsedResponse = await response.json();
        break;

      case "text/plain":
        parsedResponse = await response.text();
        break;

      default:
        parsedResponse = await response.blob();
        break;
    }
  }
  catch( e )
  {
    throw new ResponseError(
      `Failed to decode server response [contentType=${contentType}] ` +
      `from [${decodeURI(url.href)}]`);
  }

  return parsedResponse;
}
