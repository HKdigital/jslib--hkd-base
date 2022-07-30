
/* ------------------------------------------------------------------ Imports */

import { expectNotEmptyString,
         expectObject,
         expectObjectNoArray,
         expectFunction } from "@hkd-base/helpers/expect.js";

/* ---------------------------------------------------------------- Internals */

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

/**
 * Throws an exception if the URL object has any search parameter set
 *
 * @param  {URL} url
 *
 * @throws Error
 */
// function expectNoSearchParams( url )
// {
//   if( !(url instanceof URL) ) {
//     throw new Error("Missing or invalid parameter [url]");
//   }

//   for( const value of url.searchParams.values() )
//   {
//     if( value )
//     {
//       throw new Error(`Url [${url}] should not contain search parameters`);
//     }
//   } // end for
// }

// -----------------------------------------------------------------------------

/**
 * Set headers in an existing `Headers` object
 * - Existing headers with the same name will be overwritten
 * - The supplied `Headers` object will be updated, this function does not
 *   return any value
 *
 * @param {Headers} target - Headers object to set the extra headers in
 *
 * @param {object} [nameValuePairs]
 *   Object that contains custom headers. A header is a name, value pair.
 */
function setRequestHeaders( target, nameValuePairs )
{
  // eslint-disable-next-line no-undef
  if( !(target instanceof Headers) )
  {
    throw new Error(
      "Invalid parameter [target] (expected Headers object)" );
  }

  expectObjectNoArray( nameValuePairs,
      "Missing or invalid parameter [options.headers]" );

  if( nameValuePairs instanceof Headers )
  {
    throw new Error(
      "Invalid parameter [nameValuePairs] (should not be a Headers object)");
  }

  for( const name in nameValuePairs )
  {
    expectNotEmptyString( name,
      "Invalid parameter [nameValuePairs] (missing header name)" );

    const value = nameValuePairs[ name ];

    expectNotEmptyString( value, `Invalid value for header [${name}]` );


    target.set( name, value ); /* overwrites existing value */
  }
}

/* ------------------------------------------------------------------ Exports */

export const METHOD_GET = "GET";
export const METHOD_POST = "POST";

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
    case 401:
      {
        let errorMessage = "Server returned [401] Unauthorized";

        const authValue = response.headers.get("www-authenticate");

        if( authValue )
        {
          const from = authValue.indexOf("error=");

          if( from !== -1 )
          {
            let to = authValue.indexOf(",", from);

            if( -1 === to )
            {
              to = authValue.length;
            }

            errorMessage += ` (${authValue.slice( from, to )})`;
          }
        }

        throw new Error( errorMessage );
      }

    case 403:
      throw new Error(
        `Server returned - 403 Forbidden, [${decodeURI(url.href)}]`);

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
 * @param {object} [urlSearchParams]
 *   Parameters that should be added to the request url
 *
 * @param {array[]} [headers]
 *   List of custom headers. Each header is an array that contains the header
 *   name and the header value. E.g. [ "content-type", "application/json" ]
 *
 * @returns {mixed} parsed JSON response from backend server
 */
export async function jsonGet( { url, urlSearchParams, headers } )
{
  url = toURL( url );

  if( !headers )
  {
    headers = {};
  }

  headers[ "accept" ] = "application/json";

  const { responsePromise } =
    await httpRequest(
      {
        method: METHOD_GET,
        url,
        urlSearchParams,
        headers
      } );

  const response = await responsePromise;

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

// export function jsonPost( url, body=null, options ) {}

// -----------------------------------------------------------------------------

/**
 * Make GET request
 *
 * @param {string|URL} url - Url string or URL object
 *
 * @param {object} [urlSearchParams]
 *   Parameters that should be added to the request url
 *
 * @param {object} [headers]
 *   Object that contains custom headers. A header is a name, value pair.
 *
 *   e.g. options.headers = { "content-type": "application/json" }
 *
 * @param {function} [requestHandler]
 *   If defined, this function will receive the abort handler function
 *
 * @returns {Promise<*>} responsePromise
 */
export function httpGet( { url, urlSearchParams, headers } )
{
  return httpRequest(
    {
      method: METHOD_GET,
      url,
      urlSearchParams,
      headers
    } );
}

// -----------------------------------------------------------------------------

/**
 * Make POST request
 *
 * @param {string|URL} url - Url string or URL object
 *
 * @param {*} [body] - POST data
 *
 * @param {object} [headers]
 *   Object that contains custom headers. A header is a name, value pair.
 *
 *   e.g. options.headers = { "content-type": "application/json" }
 *
 * @param {function} [requestHandler]
 *   If defined, this function will receive the abort handler function
 *
 * @returns {Promise<*>} responsePromise
 */
export async function httpPost( { url, body=null, headers } )
{
  return httpRequest(
    {
      method: METHOD_POST,
      url,
      body,
      headers } );
}

// -----------------------------------------------------------------------------

/**
 * Make an HTTP request
 *
 * @param {string} method - Request method: METHOD_GET | METHOD_POST
 *
 * @param {string|URL} url - Url string or URL object
 *
 * @param {object} [urlSearchParams] - URL search parameters as key-value pairs
 *
 * @param {*} [body] - POST data
 *
 * @param {object} [headers]
 *   Object that contains custom headers. A header is a name, value pair.
 *
 *   e.g. options.headers = { "content-type": "application/json" }
 *
 * @param {function} [requestHandler]
 *   If defined, this function will receive the abort handler function
 *
 * @returns {Promise<*>} responsePromise
 */
export async function httpRequest(
  {
    method,
    url,
    urlSearchParams=null,
    body=null,
    headers,
    requestHandler
  } )
{
  url = toURL( url );

  // @see https://developer.mozilla.org/en-US/docs/Web/API/Headers

  // eslint-disable-next-line no-undef
  const requestHeaders = new Headers();
    // [
    //   [ "accept", "application/json" ]
    // ] );

  if( headers )
  {
    setRequestHeaders( requestHeaders, headers );
  }

  const init = {
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'omit',
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    headers: requestHeaders
  };

  switch( method )
  {
    case METHOD_GET:
      init.method = METHOD_GET;

      if( urlSearchParams )
      {
        if( !(urlSearchParams instanceof URLSearchParams) )
        {
          throw new Error(
            `Invalid parameter [urlSearchParams] ` +
            `(expected instanceof URLSearchParams)`);
        }

        const existingParams = url.searchParams;

        for( const [ name, value ] of urlSearchParams.entries() )
        {
          if( existingParams.has( name ) )
          {
            throw new Error(
              `Cannot set URL search parameter [${name}] ` +
              `in url [${url.href}] (already set)`);
          }

          existingParams.set( name, value );
        } // end for
      }
      break;

    case METHOD_POST:
      init.method = METHOD_POST;

      init.body = body || null; /* : JSON.stringify( body ) */
      break;

    default:
      throw new Error(`Invalid value for parameter [method=${method}]`);
  }

  //
  // Sort search params to make the url nicer
  //
  url.searchParams.sort();

  // @see https://developer.mozilla.org/en-US/docs/Web/API/Request/Request
  // @see https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort

  // eslint-disable-next-line no-undef
  const request = new Request( url, init );

  const controller = new AbortController();
  const signal = controller.signal;

  if( requestHandler )
  {
    expectFunction( requestHandler, "Invalid parameter [requestHandler]" );

    const abort = controller.abort.bind( controller );

    requestHandler( { abort } );
  }

  return /* promise */ fetch( request, { signal } );
}

