
/* ------------------------------------------------------------------ Imports */

import { expectNotEmptyString,
         expectObject,
         expectObjectNoArray,
         expectFunction } from "@hkd-base/helpers/expect.js";

import { ResponseError,
         TypeOrValueError } from "@hkd-base/types/error-types.js";

/* ---------------------------------------------------------------- Internals */

const METHOD_GET = "GET";
const METHOD_POST = "POST";

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
  else if( !(url instanceof URL) )
  {
    throw new TypeOrValueError("Missing or invalid parameter [url]");
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

  // eslint-disable-next-line no-undef
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

// -----------------------------------------------------------------------------

/**
 * Check if the response status is ok
 *
 * @param {object} response
 *
 * @throws {Error} not found
 * @throws {Error} internal server error
 */
function expectResponseOk( response, url )
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
      throw new ResponseError(
        `Server returned - 403 Forbidden, [${decodeURI(url.href)}]`);

    case 404:
      throw new ResponseError(
        `Server returned - 404 Not Found, [${decodeURI(url.href)}]`);

    case 500:
      throw new ResponseError(
        `Server returned - 500 Internal server error, [${decodeURI(url.href)}]`);

    default: // -> ok
      if( !response.ok )
      {
        throw new ResponseError(
          `Server returned - ${response.status} [response.ok=false], ` +
          `[${decodeURI(url.href)}]`);
      }
      break;
  }
}


/* ------------------------------------------------------------------ Exports */

export { METHOD_GET, METHOD_POST };

// -----------------------------------------------------------------------------

/**
 * Wait for a response and check if the response is ok
 *
 * @example
 *   const response = await waitForAndCheckResponse( responsePromise );
 *
 * --
 *
 * @param {Promise<object>} responsePromise
 * @param {URL} url - An url that is used for error messages
 *
 * --
 *
 * @throws ResponseError - A response error if something went wrong
 *
 * --
 *
 * @returns {object} response
 */
export async function waitForAndCheckResponse( responsePromise, url )
{
  if( !(responsePromise instanceof Promise) )
  {
    throw new TypeOrValueError(
      "Missing or invalid parameter [responsePromise]");
  }

  if( !(url instanceof URL) )
  {
    throw new TypeOrValueError(
      "Missing or invalid parameter [url]");
  }


  let response;

  try {
    response = await responsePromise;
  }
  catch( e )
  {
    if( e instanceof TypeError )
    {
      throw new ResponseError(
        `A network error occurred for request [${decodeURI(url.href)}]`,
        { cause: e } );
    }
    else {
      throw e;
    }
  }

  expectResponseOk( response, url );

  return response;
}

// -----------------------------------------------------------------------------

/**
 * Make a GET request to fetch JSON encoded data
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
 * --
 *
 * @throws ResponseError
 *   If a network error occurred or the response was not ok
 *
 * --
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

  const responsePromise =
    httpRequest(
      {
        method: METHOD_GET,
        url,
        urlSearchParams,
        headers
      } );


  const response = await waitForAndCheckResponse( responsePromise, url );

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
    throw new ResponseError(
      `Failed to JSON decode server response from [${decodeURI(url.href)}]`,
      { casue: e } );
  }

  if( parsedResponse.error )
  {
    throw new ResponseError(
      `Server returned response error message [${parsedResponse.error}]` );
  }

  return parsedResponse;
}

// -----------------------------------------------------------------------------

/**
 * Make a POST request to fetch JSON encoded data
 * - Expect JSON response from server
 *
 * @param {string|URL} url - Url string or URL object
 *
 * @param {*} body
 *   Data that will be converted to a JSON encoded string and send to the server
 *
 * @param {object} [urlSearchParams]
 *   Parameters that should be added to the request url.
 *
 *   @note
 *   Be careful when using urlSearchParams in POST requests, it can be
 *   confusing since the parameters usually go in the body part of the request.
 *
 * @param {array[]} [headers]
 *   List of custom headers. Each header is an array that contains the header
 *   name and the header value. E.g. [ "content-type", "application/json" ]
 *
 * --
 *
 * @throws ResponseError
 *   If a network error occurred or the response was not ok
 *
 * --
 *
 * @returns {mixed} parsed JSON response from backend server
 */
export async function jsonPost(
  {
    url,
    body,
    urlSearchParams,
    headers
  } )
{
  url = toURL( url );

  if( !headers )
  {
    headers = {};
  }

  headers[ "accept" ] = "application/json";
  headers[ "content-type" ] = "application/json";

  const responsePromise =
    httpRequest( { METHOD_POST, url, body, urlSearchParams, headers } );

  const response = await waitForAndCheckResponse( responsePromise, url );

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
    throw new ResponseError(
      `Failed to JSON decode server response from [${decodeURI(url.href)}]`);
  }

  if( parsedResponse.error )
  {
    //
    // @note this is API specific, but it's quite logical
    //
    //
    throw new ResponseError(
      `Server returned response error message [${parsedResponse.error}]` );
  }

  return parsedResponse;
}

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
export async function httpGet( { url, urlSearchParams, headers } )
{
  const responsePromise = httpRequest(
    {
      method: METHOD_GET,
      url,
      urlSearchParams,
      headers
    } );

  return await waitForAndCheckResponse( responsePromise, url );

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
  const responsePromise = httpRequest(
    {
      method: METHOD_POST,
      url,
      body,
      headers } );

  return await waitForAndCheckResponse( responsePromise, url );
}

// -----------------------------------------------------------------------------

/**
 * Make an HTTP request
 * - This is a low level function, consider using
 *   httpGet, httpPost, jsonGet or jsonPost instead
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
 *
 * --
 *
 * @throws TypeError - If a network error occurred
 *
 * @note Check the `ok` property of the resolved response to check if the
 *       response was successfull (e.g. in case of a 404, ok is false)
 *
 * --
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

  //
  // A fetch() promise will reject with a TypeError when a network error
  // is encountered or CORS is misconfigured on the server-side,
  // although this usually means permission issues or similar
  // — a 404 does not constitute a network error, for example.
  // An accurate check for a successful fetch() would include checking
  // that the promise resolved, then checking that the Response.ok property
  // has a value of true. The code would look something like this:
  //
  // fetch()
  // .then( () => {
  //   if( !response.ok ) {
  //     throw new Error('Network response was not OK');
  //   }
  //   ...
  // }
  // .catch((error) => { .. }
  //

  return /* promise */ fetch( request, { signal } );

}
