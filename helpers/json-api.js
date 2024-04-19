/* ------------------------------------------------------------------ Imports */

import { ResponseError }
  from '@hkd-base/types/error-types.js';

import { httpApiRequest }
  from '@hkd-base/helpers/http-api.js';

import { METHOD_GET,
         METHOD_POST }
  from '@hkd-base/helpers/http.js';

/* ---------------------------------------------------------------- Internals */

/* ------------------------------------------------------------------ Exports */

export const KEY_DEFAULT_JSON_API = 'default-json-api';

// export const KEY_AUTH_JSON_API = "auth-api";

// export const KEY_LIVE_JSON_API = "live-api";

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
 * @param {function} [requestHandler]
 *   If defined, this function will receive the abort handler function
 *
 * @param {number} [timeoutMs]
 *   If defined, this request will abort after the specified number of
 *   milliseconds. Values above the the built-in request timeout won't work.
 *
 * @param {object|string} [config=KEY_DEFAULT_HTTP_API]
 *   Config parameters or label of the global config entry that contains
 *   the remote API configuration.
 *
 *  e.g.
 *
 *  config = {
 *    origin,
 *    apiPrefix,
 *    token,
 *    basicAuth
 *  }
 *
 * @returns {object} { abort, jsonResponsePromise }
 */
export async function jsonApiGet(
  {
    uri,
    urlSearchParams,
    requestHandler,
    timeoutMs,
    config=KEY_DEFAULT_JSON_API
  } )
{
  return jsonApiRequest(
    {
      uri,
      urlSearchParams,
      method: METHOD_GET,
      requestHandler,
      timeoutMs,
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
 * @param {function} [requestHandler]
 *   If defined, this function will receive the abort handler function
 *
 * @param {number} [timeoutMs]
 *   If defined, this request will abort after the specified number of
 *   milliseconds. Values above the the built-in request timeout won't work.
 *
 * @param {object|string} [config=KEY_DEFAULT_HTTP_API]
 *   Config parameters or label of the global config entry that contains
 *   the remote API configuration.
 *
 *  e.g.
 *
 *  config = {
 *    origin,
 *    apiPrefix,
 *    token,
 *    basicAuth
 *  }
 *
 * @returns {mixed} parsed JSON response from backend server
 */
export async function jsonApiPost(
  {
    uri,
    body=null,
    requestHandler,
    timeoutMs,
    config=KEY_DEFAULT_JSON_API
  } )
{

  return jsonApiRequest(
    {
      uri,
      body: JSON.stringify( body ),
      method: METHOD_POST,
      requestHandler,
      timeoutMs,
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
 * @param {function} [requestHandler]
 *   If defined, this function will receive the abort handler function
 *
 * @param {number} [timeoutMs]
 *   If defined, this request will abort after the specified number of
 *   milliseconds. Values above the the built-in request timeout won't work.
 *
 * @param {object|string} [config=KEY_DEFAULT_HTTP_API]
 *   Config parameters or label of the global config entry that contains
 *   the remote API configuration.
 *
 *  e.g.
 *
 *  config = {
 *    origin,
 *    apiPrefix,
 *    token,
 *    basicAuth
 *  }
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
export async function jsonApiRequest(
  {
    uri,
    method,
    urlSearchParams,
    body,
    requestHandler,
    timeoutMs,
    config=KEY_DEFAULT_JSON_API
  } )
{
  const parsedResponse =
    await httpApiRequest(
      {
        uri,
        method,
        urlSearchParams,
        body,
        // headers,
        requestHandler,
        timeoutMs,
        config
      } );

  if( parsedResponse.error )
  {
    //
    // @note this is specific for the API implementation, not all API's
    //       return an `error` property`
    //
    throw new ResponseError( parsedResponse.error );
  }

  return parsedResponse;
}
