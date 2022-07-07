
/* ------------------------------------------------------------------ Imports */

import { expectString,
         expectNotEmptyString,
         expectObject } from "@hkd-base/helpers/expect.js";

/**
 * Ensure to return an URL instance
 *
 * @param {string|URL} url
 *
 * @returns {URL} url instance
 */
function toURL( url )
{
  if( typeof url === "string" )
  {
    return new URL( url );
  }
  else if( !(url instanceof URL) ) {
    throw new Error("Missing or invalid parameter [url]");
  }

  // already an URL instance
  return url;
}

// -----------------------------------------------------------------------------

/**
 * Check if the response status is ok
 *
 * @param {object} response
 *
 * @throws {Error} not found
 * @throws {Error} internal server error
 */
export function expectValidHttpStatus( response, url )
{
  expectObject( response, "Missing or invalid parameter [response]" );

  if( !(url instanceof URL) )
  {
    throw new Error( "Missing or invalid parameter [url]" );
  }

  switch( response.status )
  {
    case 404:
      throw new Error(
        `Server returned - 404 Not Found, [${decodeURI(url.href)}]`);

    case 500:
      throw new Error(
        `Server returned - 500 Internal server error, [${decodeURI(url.href)}]`);

    default: // -> ok
      break;
  }
}

// -----------------------------------------------------------------------------

/**
 * Make GET request to fetch JSON encoded data
 * - Expect JSON response from server
 *
 * @param {string|URL} url - Url string or URL object
 *
 * @param {object} [options]
 *
 * @returns {mixed} parsed JSON response from backend server
 */
export async function jsonGet( url, options )
{
  url = toURL( url );

  const response = await httpGet( url, { returnAbort: false, options } );

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

// -----------------------------------------------------------------------------

/**
 * Make GET request to backend
 *
 * @param {string|URL} url - Url string or URL object
 *
 * @param {object} [options]
 * @param {boolean} [options.returnAbort=true]
 *
 * @returns {object} if `options.returnAbort` was set to true,
 *   an object is returned that contains an abort function and a response
 *   promise: { abort: <function>, response: <Promise->*> }.
 *   if `options.returnAbort` was false, a response promise is returned
 */
export function httpGet( url, options={} )
{
  let returnAbort;

  ({ returnAbort=true } = options);

  if( typeof url === "string" )
  {
    console.log( url );

    url = new URL( url );
  }
  else if( !(url instanceof URL) ) {
    throw new Error("Missing or invalid parameter [url]");
  }

  // @see https://developer.mozilla.org/en-US/docs/Web/API/Headers

  // eslint-disable-next-line no-undef
  const headers = new Headers(
    [
      [ "accept", "application/json" ],
    ] );

  const init =
    {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'omit',
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
      headers
    };

  // @see https://developer.mozilla.org/en-US/docs/Web/API/Request/Request
  // @see https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort

  // eslint-disable-next-line no-undef
  const request = new Request( url, init );

  if( returnAbort )
  {
    const controller = new AbortController();
    const signal = controller.signal;

    const abort = controller.abort.bind( controller );

    return { abort, response: fetch( request, { signal } ) };
  }
  else {
    return /* async */ fetch( request );
  }
}

