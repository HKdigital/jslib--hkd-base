
/* ------------------------------------------------------------------ Imports */

import { expectNotEmptyString,
         expectPositiveNumber,
         expectObject,
         expectObjectNoArray,
         expectFunction }
  from '@hkd-base/helpers/expect.js';

import { ResponseError,
         AbortError,
         TimeoutError,
         TypeOrValueError }
  from '@hkd-base/types/error-types.js';

import { CONTENT_TYPE }
  from '@hkd-base/constants/http-headers.js';

import { APPLICATION_JSON }
  from '@hkd-base/constants/mime-types.js';

/* ---------------------------------------------------------------- Internals */

const METHOD_GET = 'GET';
const METHOD_POST = 'POST';

/**
 * Ensure to return an URL instance
 *
 * @param {string|URL} url
 *
 * @returns {URL} url instance
 */
function toURL( url )
{
  if( typeof url === 'string' )
  {
    return new URL( url );
  }
  else if( !(url instanceof URL) )
  {
    throw new TypeOrValueError('Missing or invalid parameter [url]');
  }

  // already an URL instance
  return url;
}

// -----------------------------------------------------------------------------

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
   
  if( !(target instanceof Headers) )
  {
    throw new Error(
      'Invalid parameter [target] (expected Headers object)' );
  }

  expectObjectNoArray( nameValuePairs,
      'Missing or invalid parameter [options.headers]' );

   
  if( nameValuePairs instanceof Headers )
  {
    throw new Error(
      'Invalid parameter [nameValuePairs] (should not be a Headers object)');
  }

  for( const name in nameValuePairs )
  {
    expectNotEmptyString( name,
      'Invalid parameter [nameValuePairs] (missing header name)' );

    const value = nameValuePairs[ name ];

    expectNotEmptyString( value,
      `Invalid value for header [${name}]` );

    //
    // Headers should be encoded lowercase in HTTP2
    //
    const nameLower = name.toLowerCase();

    target.set( nameLower, value ); /* overwrites existing value */
  }
}

// -----------------------------------------------------------------------------

/**
 * Try to get error information from the server response
 *
 * In case of JSON try properties:
 * - message
 * - error
 * - messages (array)
 * - errors (array)
 *
 * Otherwise try plain text
 *
 * @param {object} response
 *
 * @returns {Error} error
 */
async function getErrorFromResponse( response )
{
  let message;
  let details = null;

  const headers = response.headers;
  const contentType = headers.get( CONTENT_TYPE );

  let content;

  if( contentType === APPLICATION_JSON )
  {
    content = await response.json();

    if( typeof content === 'object' )
    {
      if( typeof content.message === 'string' )
      {
        message = content.message;
      }
      else if( typeof content.error === 'string' )
      {
        message = content.error;
      }
      else {
        if( Array.isArray( content.errors ) )
        {
          details = content.errors;
        }
        else if( Array.isArray( content.messages ) )
        {
          details = content.messages;
        }

        if( details )
        {
          const tmp = [];

          for( const current of details )
          {
            if( typeof current === 'object' && current.message )
            {
              tmp.push( current.message );
            }
            else if( typeof tmp.message === 'string' )
            {
              tmp.push( current );
            }
            else {
              tmp.push( JSON.stringify( current ) );
            }
          } // end for

          message = tmp.join(', ');
        }
      }
    }
  }
  else {
    message = await response.text();
  }

  // console.log( "message", message );

  const error = new Error( message );

  //error.details = details;

  return error;
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
async function expectResponseOk( response, url )
{
  expectObject( response, 'Missing or invalid parameter [response]' );

  url = toURL( url );

  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/200
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/201

  if( 200 === response.status || 201 === response.status )
  {
    if( !response.ok )
    {
      throw new ResponseError(
        `Server returned - ${response.status} ${response.statusText} ` +
        `[response.ok=false], [${decodeURI(url.href)}]`);
    }

    // All ok
    return;
  }

  // -- Give additional info in case of 401 Unauthorized response

  if( 401 === response.status )
  {
    let errorMessage = 'Server returned [401] Unauthorized';

    const authValue = response.headers.get('www-authenticate');

    if( authValue )
    {
      const from = authValue.indexOf('error=');

      if( from !== -1 )
      {
        let to = authValue.indexOf(',', from);

        if( -1 === to )
        {
          to = authValue.length;
        }

        errorMessage += ` (${authValue.slice( from, to )})`;
      }
    }

    throw new Error( errorMessage );
  }

  // -- Gather additional info for all other responses

  const error = await getErrorFromResponse( response );

  throw new ResponseError(
    `Server returned - ${response.status} ${response.statusText}, ` +
    `[${decodeURI(url.href)}]`, { cause: error } );

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
      'Missing or invalid parameter [responsePromise]');
  }

  url = toURL( url );

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

  await expectResponseOk( response, url );

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

  headers[ 'accept' ] = 'application/json';

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
    throw new ResponseError(
      `Failed to JSON decode server response from [${decodeURI(url.href)}]`,
      { cause: e } );
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
  else {
    expectObject( headers,
      'Invalid value for parameter [headers]' );
  }

  headers[ 'accept' ] = 'application/json';
  headers[ 'content-type' ] = 'application/json';

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
 * @param {number} [timeoutMs]
 *   If defined, this request will abort after the specified number of
 *   milliseconds. Values above the the built-in request timeout won't work.
 *
 * @returns {Promise<*>} responsePromise
 */
export async function httpGet(
  {
    url,
    urlSearchParams,
    headers,
    requestHandler,
    timeoutMs
  } )
{
  const responsePromise = httpRequest(
    {
      method: METHOD_GET,
      url,
      urlSearchParams,
      headers,
      requestHandler,
      timeoutMs
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
 * @param {number} [timeoutMs]
 *   If defined, this request will abort after the specified number of
 *   milliseconds. Values above the the built-in request timeout won't work.
 *
 * @returns {Promise<*>} responsePromise
 */
export async function httpPost(
  {
    url,
    body=null,
    headers,
    requestHandler,
    timeoutMs
  } )
{
  const responsePromise = httpRequest(
    {
      method: METHOD_POST,
      url,
      body,
      headers,
      requestHandler,
      timeoutMs } );

  return await waitForAndCheckResponse( responsePromise, url );
}

// -----------------------------------------------------------------------------

/**
 * Make an HTTP request
 * - This is a low level function, consider using
 *   httpGet, httpPost, jsonGet or jsonPost instead
 *
 * @param {string|URL} url - Url string or URL object
 *
 * @param {string} method - Request method: METHOD_GET | METHOD_POST
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
 * @param {number} [timeoutMs]
 *   If defined, this request will abort after the specified number of
 *   milliseconds. Values above the the built-in request timeout won't work.
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
    requestHandler,
    timeoutMs
  } )
{
  url = toURL( url );

  // @see https://developer.mozilla.org/en-US/docs/Web/API/Headers

   
  const requestHeaders = new Headers();

  if( headers )
  {
    setRequestHeaders( requestHeaders, headers );

    if( headers[ CONTENT_TYPE ] === APPLICATION_JSON &&
        typeof body !== 'string' )
    {
      throw new Error(
        `Trying to send request with [content-type:${APPLICATION_JSON}], ` +
        'but body is not a (JSON encoded) string.');
    }
    // IDEA: try to decode the body to catch errors on client side
  }

  const init = {
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'omit',
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    headers: requestHeaders
  };

  // Allow search params also for other request types than GET

  if( urlSearchParams )
  {
    if( !(urlSearchParams instanceof URLSearchParams) )
    {
      throw new Error(
        'Invalid parameter [urlSearchParams] ' +
        '(expected instanceof URLSearchParams)');
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

  //
  // Sort search params to make the url nicer
  //
  url.searchParams.sort();

  // console.log( "url", url );

  init.method = method;

  if( METHOD_POST === method )
  {
    init.body = body || null; /* : JSON.stringify( body ) */
  }

  // @see https://developer.mozilla.org/en-US/docs/Web/API/Request/Request

  // console.log( "init", init );
  // console.log( "headers", init.headers );

   
  const request = new Request( url, init );

  // @see https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort

  const controller = new AbortController();
  const signal = controller.signal;

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

  const promise = fetch( request, { signal } );

  if( requestHandler || timeoutMs )
  {
    const abort = ( reason ) =>
      {
        if( !reason )
        {
          reason = new AbortError(`Request [${url.href}] aborted`);
        }

        controller.abort( reason );
      };

    /**
     * Function that can be used to set a timeout on a request
     *
     * @param {number} delayMs
     */
    const timeout = ( delayMs=10000 ) =>
      {
        expectPositiveNumber( delayMs, 'Invalid value for [delayMs]' );

        const timerId =
          setTimeout( () =>
            {
              controller.abort(
                new TimeoutError(
                  `Request [${url.href}] timed out [${delayMs}]`) );
            },
            delayMs );

        promise.finally( () => {
          clearTimeout( timerId );
        } );
      };

    if( timeoutMs )
    {
      timeout( timeoutMs );
    }

    if( requestHandler )
    {
      expectFunction( requestHandler,
        'Invalid parameter [requestHandler]' );

      requestHandler( { controller, abort, timeout } );
    }
  }

  return promise;
}
