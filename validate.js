
/* ------------------------------------------------------------------ Imports */

import { parseValue, parseObject } from "$hk/parse.js";

/* ------------------------------------------------------------------ Exports */

// ---------------------------------------------------------------------- Method

/**
 * Validate a single value
 *
 * @param {mixed} [value] -  Value to validate
 *
 * @param {Object} parseInfo - Parse information
 *
 * @return {Object} validation result
 *
 *  On success:
 *    {
 *      isValid: true,
 *      parsed: <parsed parameters> (@see hk.parseObject)
 *    }
 *
 *  On failure:
 *    {
 *      isValid: false,
 *      error: <Error Object>
 *    }
 */
export function validateValue( value, parseInfo )
{
  if( !parseInfo )
  {
    return { isValid: true, parsed: value };
  }
  else if( !(parseInfo instanceof Object) &&
           parseInfo !== 1 &&
           parseInfo !== true)
  {
    throw new Error(
      "Invalid parameter [parseInfo] (expected object or 1 or true)");
  }

  try {
    let parsed = parseValue( value, parseInfo );

    return { isValid: true, parsed };
  }
  catch( e )
  {
    return { isValid: false, error: e, value, parseInfo };
  }
}

// ---------------------------------------------------------------------- Method

/**
 * Validate a (parameters) object
 * - Stops validation on first error that is encountered
 *
 * @note to validate all properties; use hk.validateAllProperties
 *
 * @param {Object} [params] - Object to validate, may be null or undefined
 *
 * @param {Object} parseInfo - Parse information
 *
 * @return {Object} validation result
 *
 *  On success:
 *    {
 *      isValid: true,
 *      parsed: <parsed parameters> (@see hk.parseObject)
 *    }
 *
 *  On failure:
 *    {
 *      isValid: false,
 *      key: ,
 *      value: ,
 *      error: <Error Object>
 *    }
 */
export function validateObject( params, parseInfo )
{
  if( !params )
  {
    params = {};
  }
  else if( !(params instanceof Object) )
  {
    throw new Error("Invalid parameter [params] (expected object)");
  }

  if( !parseInfo )
  {
    return { isValid: true, parsed: params };
  }
  else if( !(parseInfo instanceof Object) )
  {
    throw new Error("Invalid parameter [parseInfo] (expected object)");
  }


  try {
    let parsed = parseObject( params, parseInfo );

    return { isValid: true, parsed };
  }
  catch( e )
  {
    // console.log( e );

    return {
        isValid: false,
        key: e.key,
        value: e.value,
        parseInfo: e.parseInfo || null,
        object: e.object,
        objectParseInfo: e.objectParseInfo,
        error: e
      };
  }
}

// ---------------------------------------------------------------------- Method

/**
 * Validate all properties of a (parameters) object
 * - In contrast with validateObject, this method will continue the
 *   validation if the validation fails for an other property.
 *
 * @param {Object} [params] - Object to validate, may be null or undefined
 *
 * @param {Object} parseInfo - Parse information
 *
 * @return {Object[]} List of validation results for all properties
 *
 *  On success:
 *    {
 *      isValid: true,
 *      parsed: <parsed parameters> (@see hk.parseObject)
 *    }
 *
 *  On failure:
 *    {
 *      isValid: false,
 *      key: ,
 *      value: ,
 *      error: <Error Object>
 *    }
 */
export function validateAllProperties( params, parseInfo, options )
{
  if( !params )
  {
    params = {};
  }
  else if( !(params instanceof Object) )
  {
    throw new Error("Invalid parameter [params] (expected object)");
  }

  if( !parseInfo )
  {
    return { isValid: true, parsed: params };
  }
  else if( !(parseInfo instanceof Object) )
  {
    throw new Error("Invalid parameter [parseInfo] (expected object)");
  }

  const result = {};

  let subResult;
  let allValid = true;

  let validatedKeysSet = new Set();

  for( let key in parseInfo )
  {
    validatedKeysSet.add( key );

    subResult =
      validateValue( params[ key ], parseInfo[key], options );

    if( !subResult.isValid )
    {
      allValid = false;
      subResult.key = key;
    }

    // console.log("subResult", subResult);
    // console.log("validateAllProperties", validateAllProperties);

    result[key] = subResult;

  } // end for

  // -- Check validatedKeysSet

  for( let key in params )
  {
    if( !validatedKeysSet.has( key ) )
    {
      throw new Error("Unaccepted parameter ["+key+"]");
    }
  }

  return {
    allValid: allValid,
    properties: result
  };
}
