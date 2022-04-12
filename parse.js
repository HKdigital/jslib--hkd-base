
/* ------------------------------------------------------------------ Imports */

import { raise } from "$hk/exceptions.js";

import { equals } from "$hk/compare.js";

/* ---------------------------------------------------------------- Internals */

const invalid$ = Symbol("invalid");

//
// EXT_LATIN_TOKENS_LC
// - Extended list of latin tokens, works for most latin languages
//
// @note
//   Both upper- and lower case extended latin tokens are:
//   "ŠŒŽšœžŸñÑÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðòóôõöøùúûüýþÿ"
//
// TODO:
//   Replace with unicode property escapes when supported ES2018
//   (not yet supported by MS Edge 12)
//   https://github.com/tc39/proposal-regexp-unicode-property-escapes
//   http://unicode.org/Public/UNIDATA/PropertyValueAliases.txt
//   https://www.fileformat.info/info/unicode/category/index.htm
//   https://github.com/danielberndt/babel-plugin-utf-8-regex/
//     blob/master/src/transformer.js
//
const EXT_LATIN_TOKENS_LC = "šœžÿñàáâãäåæçèéêëìíîïðòóôõöøùúûüýþß";

// RegExp and RegExp part constants

// TODO:
//   regexAstralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
//   "-~.,`'\"‘’“”„±€$@%&¡¿©®"
//   REP_PUNCTUATION = ",.¡!¿?;:-";

const C =
  {
    EXT_LATIN_TOKENS_LC,
    REP_NUMBER: "0-9",
    REP_LETTER_LC: `a-z${EXT_LATIN_TOKENS_LC}`,
    REP_LETTER_NUMBER_LC: `0-9a-z${EXT_LATIN_TOKENS_LC}`
  };

const RE =
  {
    EMAIL: new RegExp(
      '^(([^<>()[\\]\\.,;:\\s@"]+(.[^<>()[\\]\\.,;:\\s@"]+)*)|(".+"))@((([' +
      '\\-' + C.REP_LETTER_NUMBER_LC +
      ']+\\.)+[' + C.REP_LETTER_LC + ']{2,}))$', 'i' ),

    // PHONE: new RegExp(
    //   '(^\\+[0-9]{2}|^\\+[0-9]{2}\\(0\\)|^\\(\\+[0-9]{2}\\)\\(0\\)'+
    //   '|^00[0-9]{2}|^0)([0-9]{9}$|[0-9\\-\\s]{10}$)'),

    PHONE:
      /(^\+[0-9]{2}|^\+[0-9]{2}\(0\)|^\(\+[0-9]{2}\)\(0\)|^00[0-9]{2}|^0)([0-9]{9}$|[0-9\-\s]{10}$)/,

    // URL: // << TODO

    POSTAL_CODE_DUTCH: /^[1-9]{1}[0-9]{3} ?[A-Za-z]{2}$/,

    NAME: new RegExp( "^[" + C.REP_LETTER_LC + "\\s-]{2,}$", "i" ),

    FANTASY_NAME: new RegExp(
      "^[" + C.REP_LETTER_NUMBER_LC + "\\s-_&|,./\\\\]{2,}$", "i" ),

    ADDRESS:
      new RegExp( "^[" + C.REP_LETTER_NUMBER_LC + ".,°\\s-]{2,}$", "i" ),

    HAS_A_LETTER_OR_NUMBER: new RegExp( "[a-z0-9]+", "i" ),

    MULTIPLE_SPACES: /  +/g,

    TABLE_PATH: new RegExp('^[a-z0-9_]+[.]{0,1}[a-z0-9_]*$')
  };

// var RE_URL = "TODO";

// @see http://regexlib.com/Search.aspx?k=phone%20number
// const RE.PHONE =
//   stdConst.RE.PHONE =
// /(^\+[0-9]{2}|^\+[0-9]{2}\(0\)|^\(\+[0-9]{2}\)\(0\)|^00[0-9]{2}|^0)([0-9]{9}$|[0-9\-\s]{10}$)/;

// const RE.POSTAL_CODE_DUTCH =
//   stdConst.RE.POSTAL_CODE_DUTCH = /^[1-9]{1}[0-9]{3} ?[A-Za-z]{2}$/;

//
// @see https://usefulshortcuts.com/alt-codes/accents-alt-codes.php
//

const metaTypeCache = {};

// ------------------------------------------------------ String parser settings

const StringParserSettings =
{
  string: {},

  email:
  {
    filters: {
      trim: true,
      toLowerCase: true,
      singleSpaces: true
    },
    test: ( value ) => RE.EMAIL.test( value )
  },

  phone:
  {
    filters: {
      trim: true,
      singleSpaces: true
    },
    test: ( value ) => RE.PHONE.test( value )
  },

  name:
  {
    filters: {
      trim: true,
      singleSpaces: true
    },
    test: ( value ) =>
    {
      if( value.length >= 2 && RE.NAME.test( value ) )
      {
        return true;
      }
      return false;
    }
  },

  "fantasy-name":
  {
    filters: {
      trim: true,
      singleSpaces: true
    },
    test: ( value ) =>
    {
      if( value.length >= 2 &&
          RE.FANTASY_NAME.test(value) &&
          RE.HAS_A_LETTER_OR_NUMBER.test( value ) )
      {
        return true;
      }
      return false;
    }
  },

  address:
  {
    filters: {
      trim: true,
      singleSpaces: true
    },
    test: ( value ) =>
    {
      if( value.length >= 2 && RE.ADDRESS.test( value ) )
      {
        return true;
      }
      return false;
    }
  },

  "postal-code-dutch":
  {
    filters: {
      trim: true,
      toUpperCase: true,
      singleSpaces: true
    },
    regexp: RE.POSTAL_CODE_DUTCH
  }
};

// Add alias phone-number -> phone

StringParserSettings["phone-number"] = StringParserSettings["phone"];

/* ------------------------------------------------------------------ Exports */

// ---------------------------------------------------------------------- Method

/**
 * Returns true if the supplied value is a valid table path
 *
 * @param {mixed} value
 *
 * @returns {boolean} True if the specified table path is valid table path
 */
// export function isValidTablePath( value )
// {
//   if( !value ||
//       typeof value !== "string" ||
//       false === RE.TABLE_PATH.test( value ) )
//   {
//     return false;
//   }

//   return true;
// }

// ---------------------------------------------------------------------- Method

/**
 * Parse an "@item" or "@list" populate selector
 *
 * @param {mixed} value - "@item" selector
 *
 * @returns {boolean} true is the selector is valid
 */
// export function isValidPopulateSelector( value )
// {
//   if( !Array.isArray( value ) )
//   {
//     // Not and array => no a populate selector
//     return false;
//   }

//   const n = value.length;

//   if( n === 0 )
//   {
//     // An empty array is a valid populate selector (select nothing)
//     return true;
//   }

//   if( n > 5 )
//   {
//     // Longer than longest possible populate selector:
//     // [tablePath, selectorKey, selectorValue, fields, options]
//     return false;
//   }

//   if( !isValidTablePath( value[0] ) )
//   {
//     // value[0] is not a valid table path
//     return false;
//   }

//   if( 1 === n )
//   {
//     // Only tablePath was specified (done)
//     return true;
//   }

//   if( 2 === n )
//   {
//     // A populate selector of length 2 is a special populate selector.
//     //
//     // It should look like
//     // [ tablePath, "<selectorKey>=this.<selectorValue>" ]
//     //
//     // e.g. [ "colors", "groupId=this._id" ]
//     //
//     const [ prop1, prop2 ] = value[1].split("=this.");

//     if( prop1.length && prop2.length )
//     {
//       return true;
//     }

//     // Only tableName and selectorKey were specified
//     // (missing selectorValue)
//     return false;
//   }

//   if( typeof value[1] !== "string" || !value[1].length )
//   {
//     // Invalid selectorKey
//     return false;
//   }

//   // -- Check selectorValue(s)

//   const selectorValues = value[2];

//   if( !(selectorValues instanceof Object) )
//   {
//     // selectorValues is not an Object => it's a primitive => valid
//     return true;
//   }

//   if( !Array.isArray( selectorValues ) )
//   {
//     // If selectorValues is not a primitive it should be a list
//     // of primitives
//     return false;
//   }

//   for( let k = selectorValues.length - 1; k >= 0; k = k - 1 )
//   {
//     const value = selectorValues[k];

//     if( value instanceof Object || undefined === value )
//     {
//       // selectorValues is not a list of primitives
//       return false;
//     }
//   } // end for

//   // -- Check fields

//   if( n <= 3 )
//   {
//     // populateSelector does not contain fields or options
//     return true;
//   }

//   let selectorFields = value[3];

//   if( !(selectorFields instanceof Object) )
//   {
//     // selectorFields should be an object
//     return false;
//   }

//   // -- Check options

//   if( n <= 4 )
//   {
//     // populateSelector does not contain options
//     return true;
//   }

//   let selectorOptions = value[4];

//   if( !(selectorOptions instanceof Object) )
//   {
//     // selectorOptions should be an object
//     return false;
//   }

//   return true;
// }

// ---------------------------------------------------------------------- Method

/**
 * Parse a (single) value
 * - Ouputs the parsed result: validated and possibly processed by the
 *   specified parse filter
 *
 * @param {mixed} value - Value to parse
 * @param {object} parseInfo - Parse info to use to parse the value
 *
 * @param {object} options
 * @param {boolean} [options.ignoreRequired=false]
 *   Ignore missing properties; even if in parseInfo the required flag
 *   has been set (useful to check partial objects)
 *
 * @param {boolean} [options.useNullToDelete=false]
 *   If true; a value null means that the value should be deleted
 *   (the return value will be null)
 *
 * @return {mixed} parsed value
 */
export function parseValue( value, parseInfo, options )
{
  let ignoreRequired = false;
  let useNullToDelete = false;

  if( options )
  {
    if( options.ignoreRequired )
    {
      ignoreRequired = true;
    }

    if( options.useNullToDelete )
    {
      useNullToDelete = true;
    }
  }

  // console.log( {ignoreRequired, useNullToDelete} );

  // >> CASE A: parseInfo is 1 or true => every value is valid

  if( !(parseInfo instanceof Object) )
  {
    if( 1 === parseInfo || true === parseInfo )
    {
      // Everything is valid, also undefined
      return value;
    }

    throw new Error(
      "Invalid parameter [parseInfo] (expected object or 1 or true)");
  }

  // >> CASE B: value = null

  // if( null === value && useNullToDelete )
  if( null === value )
  {
    if( useNullToDelete )
    {
      // null is ok, used to delete value
      return null;
    }

    if( parseInfo.required )
    {
      raise(
        "Value should not be [null] (required property)",
        {
          reason: "required",
          value,
          parseInfo
        } );
    }

    // - value is null
    // - the value is not required
    // - null is used to delete the value
    // => valid
    return null;
  }

  // >> CASE C: value = undefined

  if( undefined === value )
  {
    if( undefined !== parseInfo.default )
    {
      // return default value
      return parseInfo.default;
    }
    else if( parseInfo.required && !ignoreRequired )
    {
      raise(
        "Value should not be [undefined] (required property)",
        {
          reason: "required",
          value,
          parseInfo
        } );
    }
    else {
      // undefined is allowed..
      return undefined;
    }
  }

  // >> CASE D: value = NaN

  if( /* typeof value === "number" && */ Number.isNaN( value ) )
  {
    // @note Number.isNaN( "hello" ) -> false

    raise(
      "Value should not be [NaN]",
      {
        reason: "NaN",
        value,
        parseInfo
      } );
  }

  // >> CASE E: value = <not-empty-string> or <empty-string> + not-required

  if( typeof value === "string" && parseInfo.type === "string" )
  {
    if( value.length || !parseInfo.required )
    {
      // - not-empty-string
      //   OR
      // - not required => empty string is valid

      // Additional parse checks for strings

      _tryCheckMinLength( value, parseInfo );
      _tryCheckMaxLength( value, parseInfo );

      return value;
    }
  }

  // >> CASE F: if parseInfo.equals has been set => test

  const equalsValue = parseInfo.equals;

  if( undefined !== equalsValue )
  {
    switch( typeof equalsValue )
    {
      case 'string':
      case 'number':
      case 'boolean':
        if( value === equalsValue )
        {
          return value;
        }
        break;

      case 'object':
        if( null === value && null === equalsValue )
        {
          return value;
        }
        else if( equals( value, equalsValue ) )
        {
          return value;
        }
        break;

      default:
        break;
    }

    raise(
      _typeErrorMessage( parseInfoType ),
      {
        reason: "invalidType",
        value,
        parseInfo
      } );
  }

  // >> CASE G: check if value against [parseInfo.type]

  // -- Convert parseInfoType to a list of allowed data types (uses caching)

  let parseInfoType = parseInfo.type;

  let allowedDataTypes;

  if( !parseInfoType )
  {
    throw new Error("Missing property [parseInfo.type]");
  }

  if( typeof parseInfoType === "string" )
  {
    allowedDataTypes = metaTypeCache[ parseInfoType ];

    if( !allowedDataTypes )
    {
      // Split string into allowed types
      allowedDataTypes = parseInfoType.split("|");

      // Deduplicate
      allowedDataTypes = Array.from( new Set( allowedDataTypes ).values() );

      // Add to cache
      metaTypeCache[ parseInfoType ] = allowedDataTypes;
    }
  }
  else if( Array.isArray( parseInfoType ) )
  {
    // List supplied => assume expert mode (not so much checks)
    allowedDataTypes = parseInfoType;
  }
  else {
    throw new Error(
      "Invald value for property [parseInfo.type] " +
      "(expected string or string[])");
  }

  // -- Check if value is of one of the allowed data types

  let typeIsValid = false;

  const typeofValue = typeof value;

  // -- Loop over allowed data types

  loop: for( let j = allowedDataTypes.length - 1; j >= 0; j = j - 1 )
  {
    const expectedType = allowedDataTypes[j];

    // ~ SUB CASE: value = primitive

    if( !(value instanceof Object) )
    {
      if( typeofValue === "string" )
      {
        value = _parseString( value, expectedType, parseInfo );

        if( invalid$ !== value )
        {
          // - value was parsed correctly
          // - value matches expectedType

          // Additional parse checks for strings
          _tryCheckMinLength( value, parseInfo );
          _tryCheckMaxLength( value, parseInfo );

          typeIsValid = true;
          break loop;
        }

        // not parsed => try next expectedType
        continue;
      }
      else if( typeofValue === expectedType ) // number, boolean
      {
        // - typeof value matches expected type
        // - value is not NaN

        _tryCheckValueRange( value, parseInfo );

        typeIsValid = true;
        break loop;
      }
    }

    // ~ SUB CASE: value is an array or object

    if( Array.isArray( value ) )
    {
      switch( expectedType )
      {
        case "array":
          // - typeof value = array, expectedType = array

          // Additional parse checks for arrays
          _tryCheckMinLength( value, parseInfo );
          _tryCheckMaxLength( value, parseInfo );

          typeIsValid = true;
          break loop;

        // case "@item":
        // case "@list":
        //   if( value.length )
        //   {
        //     if( !Array.isArray( value[1] ) )
        //     {
        //       // First element is not an Array => normal pop selector
        //       typeIsValid = populateSelector( value );
        //     }
        //     else {
        //       // value is a multi selector (array of selectors)
        //       // => assume valid first but check all sub selectors
        //       typeIsValid = true;

        //       for( let k = value.length - 1; k >= 0; k = k - 1 )
        //       {
        //         if( !populateSelector( value[k] ) )
        //         {
        //           // One of the sub selectors is not valid
        //           typeIsValid = false;
        //           break loop;
        //         }
        //       } // end for
        //     }
        //   }
        //   else {
        //     // Empty pop selector => valid
        //     typeIsValid = true;
        //   }
        //   break loop;
      }

      // no valid type found => try next expectedType
      continue;
    }
    else if( "object" === expectedType )
    {
      // - typeof value = object, expectedType = object
      // => break for loop
      typeIsValid = true;
      break loop;
    }
  } // end for

  // -- Throw an exception if no valid type has been found

  if( !typeIsValid )
  {
    raise(
      _typeErrorMessage( parseInfoType ),
      {
        reason: "invalidType",
        value,
        parseInfo
      } );
  }

  return value;
}

// ---------------------------------------------------------------------- Method

/**
 * Process a (parameters) object
 *
 * @param {Object} [object]
 *   Data to parse, may be null or undefined
 *
 * @param {Object} objectParseInfo
 *   Parse information to use to parse the supplied data.
 *
 *   The objectParseInfo object defines meta information for each property
 *   in the data object that should be parsed.
 *
 *     @eg {
 *           firstName: 1,
 *           lastName: 1,
 *           email: { type: 'email' },
 *           age: {
 *             type: "number",
 *             required: true,
 *             range: {
 *               min: 1,
 *               max: 100,
 *               integer: true
 *             }
 *           }
 *           otherProperty: <parseInfo>
 *         } );
 *
 * @param {Object|1|true} objectParseInfo.x.parseInfo -
 *   Meta information about the property to parse
 *
 * @param {string|Array} objectParseInfo.x.parseInfo.type -
 *   Expected type or list of types
 *
 * @param {mixed} objectParseInfo.x.parseInfo.default -
 *   Default value to set if the property is not supplied
 *
 * @param {number|boolean} objectParseInfo.x.parseInfo.required -
 *   If set to 1 or true, the property is required
 *
 * @param {number} [objectParseInfo.x.parseInfo.minLength=0] -
 *   Minimum length of the supplied string or array
 *
 * @param {number} [objectParseInfo.x.parseInfo.maxLength=infinity] -
 *   Maximum length of the supplied string or array
 *
 * @param {object} [objectParseInfo.x.parseInfo.range] -
 *   Range object, e.g. generated by hk.newRange() or a range object
 *   description that can be converted to a HkRange object.
 *
 * ... TODO: more parsInfo options
 *
 * @param {object} options
 *
 * @param {boolean} [options.ignoreRequired=false]
 *   Ignore missing properties; even if in parseInfo the required flag
 *   has been set (useful to check partial objects)
 *
 * @param {boolean} [options.useNullToDelete=false]
 *   If true; a value null means that the property should be deleted.
 *   This is only valid if parseInfo.required has not been set to true.
 *
 * @param {boolean} [options.ignoreDefault=false]
 *   Do not set default values for missing properties
 *
 * @throws ExtendedException
 *        {
 *          key: <property name that caused the exception>,
 *          value: <value of the erroneous property>,
 *          parseInfo: <parse info of the erroneous property>,
 *          object: <input parameter object>,
 *          objectParseInfo: <original parameter objectParseInfo>
 *        } );
 *
 * @return {Object} processed object
 */
export function parseObject( object, objectParseInfo, options )
{
  // -- Check input parameters

  if( !(object instanceof Object) )
  {
    throw new Error("Invalid parameter [object] (expected object)");
  }

  if( !objectParseInfo )
  {
    return object;
  }
  else if( !(objectParseInfo instanceof Object) )
  {
    throw new Error("Invalid parameter [parseInfo] (expected object)");
  }

  // -- Process options

  // let ignoreRequired = false;
  let useNullToDelete = false;
  let ignoreDefault = false

  if( options )
  {
    // if( options.ignoreRequired )
    // {
    //   ignoreRequired = true;
    // }

    if( options.useNullToDelete )
    {
      useNullToDelete = true;
    }

    if( options.ignoreDefault )
    {
      ignoreDefault = true;
    }
  }

  // -- Helper functions and variables

  const parseInfoKeys = new Set();

  // @note out === object unless changed

  let out = object;

  function update_key( key, value )
  {
    if( out === object )
    {
      out = Object.assign( {}, object );
    }
    out[ key ] = value;
  }

  function delete_key( key )
  {
    if( out === object )
    {
      out = Object.assign( {}, object );
    }
    delete out[ key ];
  }

  // -- Process properties using "parseInfo"

  // @note define parseInfo and key before try block, used in "catch"
  let parseInfo;
  let key;

  try {
    for( key in objectParseInfo )
    {
      parseInfo = objectParseInfo[ key ];

      let value = object[key];

      if( ignoreDefault && value === undefined )
      {
        continue;
      }

      parseInfoKeys.add( key );

      if( value === null )
      {
        if( useNullToDelete )
        {
          if( parseInfo.required )
          {
            raise(
              `Value [null] is not allowed. (parameter [${key}] ` +
              `is required and [useNullToDelete=true] has been set)`,
              {
                key,
                value: object[key],
                object,
                objectParseInfo
              } );
          }

          delete_key( key );
        }
        else {
          out[key] = null;
        }

        continue;
      }

      let parsedValue = parseValue( value, parseInfo, options );

      if( value !== parsedValue )
      {
        // @note assume value does not return null

        update_key( key, parsedValue );
      }

    } // end for
  }
  catch( e )
  {
    raise(
      `Failed to parse property [${key}]`,
      { key, parseInfo, object, objectParseInfo },
      e );
  }

  // -- Check for properties that are not defined in parseInfo

  for( let key in object )
  {
    if( !parseInfoKeys.has( key ) )
    {
      raise(
        `Unaccepted parameter [${key}]`,
        {
          key,
          value: object[key],
          object,
          objectParseInfo
        } );
    }
  } // end for

  // -- Return parsed result

  return out;
}

/* --------------------------------------------------------- Internal methods */

// ---------------------------------------------------------------------- Method

/**
 * If [parseInfo.minLength] has been set, the array or string will be
 * checked for a minimal length
 *
 * @param {string|array} value - The value to check
 * @param {object} parseInfo
 */
function _tryCheckMinLength( value, parseInfo )
{
  // console.log("_tryCheckMinLength", value, parseInfo);

  if( undefined === parseInfo.minLength )
  {
    return;
  }

  // FIXME: string.length is not the number of unicode tokens

  if( value.length < parseInfo.minLength )
  {
    raise(
      `Invalid length [minLength=${parseInfo.minLength}]`,
      {
        reason: "minLength",
        value,
        parseInfo
      } );
  }
}

// ---------------------------------------------------------------------- Method

/**
 * If [parseInfo.minLength] has been set, the array or string will be
 * checked for a maximum length
 *
 * @param {string|array} value - The value to check
 * @param {object} parseInfo
 */
function _tryCheckMaxLength( value, parseInfo )
{
  if( undefined === parseInfo.maxLength )
  {
    return;
  }

  if( value.length > parseInfo.maxLength )
  {
    raise(
      `Invalid length [maxLength=${parseInfo.maxLength}]`,
      {
        reason: "maxLength",
        value,
        parseInfo
      } );
  }
}

// ---------------------------------------------------------------------- Method

/**
 * If [parseInfo.minLength] has been set, the array or string will be
 * checked for a minimal length
 *
 * @param {string} value - The value to check
 * @param {object} parseInfo
 */
function _tryCheckValueRange( value, parseInfo )
{
  if( !parseInfo.range )
  {
    return;
  }

  throw new Error("Not implemented yet [parseInfo.range]");

  // let range = parseInfo.range;

  // if( undefined === range )
  // {
  //   return;
  // }
  // else if( !(range instanceof Object) )
  // {
  //   throw new Error("Invalid parameter [range] (expected object or array)");
  // }

  // if( !range.isHkRange )
  // {
  //   range = hk.newRange( range );
  // }

  // if( typeof range.isInRange === "function" )
  // {
  //   if( false === range.isInRange( value ) )
  //   {
  //     raise(
  //       `Value out of range`,
  //       {
  //         reason: "outOfRange",
  //         value,
  //         parseInfo
  //       } );
  //   }
  // }
}

// ---------------------------------------------------------------------- Method

/**
 * Get a "type error" message text
 *
 * @param {string|string{}} [parseInfoType]
 *
 * @returns {string} type error message text
 */
function _typeErrorMessage( parseInfoType )
{
  let typeStr;

  if( Array.isArray( parseInfoType ) )
  {
    typeStr = ` (expected [${parseInfoType.join(",")}])`;
  }
  else if( typeof parseInfoType === "string" )
  {
    typeStr = ` (expected [${parseInfoType}])`;
  }
  else {
    typeStr = "";
  }

  return "Invalid type" + typeStr;
}

// ---------------------------------------------------------------------- Method

/**
 * Parse a string
 * - Retruns invalid$ if the string could not be parsed
 *
 * @param {string} value - The value to parse
 * @param {string} expectedType - The expected type, e.g. "string" or "email"
 * @param {string} parseInfo  The parse information
 *
 * @returns {string|Symbol} the processed string type or invalid$
 */
function _parseString( value, expectedType, parseInfo )
{
  // @note expect value to be a string
  // @note expect expectedType to be a string
  // @note expect parseInfo to be an object

  // -- Get parser settings

  const settings = StringParserSettings[ expectedType ];

  if( !settings )
  {
    // No settings for the expected type
    // => expectedType is not a string type
    // => cannot parse
    return invalid$;
  }

  // -- Normalize unicode sequences

  value = value.normalize();

  // -- Get filter settings from parseInfo

  let trim = parseInfo.trim;
  let singleSpaces = parseInfo.singleSpaces;
  let toLowerCase = parseInfo.toLowerCase;
  let toUpperCase = parseInfo.toUpperCase;

  const { filters, test } = settings;

  // -- Get filter settings from string parser

  if( filters )
  {
    if( filters.trim )
    {
      trim = 1;
    }

    if( filters.singleSpaces )
    {
      singleSpaces = 1;
    }

    if( filters.toLowerCase )
    {
      toLowerCase = 1;
    }
    else if( filters.toUpperCase )
    {
      toUpperCase = 1;
    }
  }

  // -- Apply filters

  if( trim )
  {
    value = value.trim();
  }

  if( singleSpaces )
  {
    value.replace( RE.MULTIPLE_SPACES, ' ' );
  }

  if( toLowerCase )
  {
    value = value.toLowerCase();
  }

  if( toUpperCase )
  {
    value = value.toUpperCase();
  }

  // -- Test value

  if( test( value ) )
  {
    return value;
  }

  return invalid$;
}
