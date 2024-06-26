/**
 * expect.js
 *
 * @description
 * This file contains code that can be used to do runtime data type and value
 * checks.
 *
 * @example
 *
 *   import { expectString } from "./expect.js";
 *
 *   function sayMyName( name )
 *   {
 *     expectString( name, "Missing or invalid parameter [name]" );
 *     ...
 *   }
 */

/* ------------------------------------------------------------------ Imports */

import { TypeOrValueError }
  from '../types/error-types.js';

import { RE_URI_COMPONENT }
  from '../constants/regexp.js';

/* ------------------------------------------------------------------ Exports */

/**
 * Returns the type of the supplied value, like "typeof", but a bit more
 * detailed:
 * - returns "null" for null
 * - TODO: return "ArrayBuffer" for e.g. ArrayBuffer
 *
 * @param {*} value - Value to get the type of
 *
 * @return {string} Type of the supplied value
 */
export function type( value )
{
  const typeofValue = typeof value;

  switch( typeofValue )
  {
    case 'object':
      if( value === null )
      {
        return 'null';
      }
      else if( value instanceof Promise )
      {
        return 'Promise';
      }
      else if( value instanceof Map )
      {
        return 'Map';
      }
      else if( value instanceof Set )
      {
        return 'Set';
      }
      // else if( typeof value.next === "function" )
      // {
      //   return "Iterator";
      // }
      // else if( value instanceof ArrayBuffer )
      // {
      //   return "ArrayBuffer";
      // }

      return 'object';

    default:
      return typeofValue;
  }
}

// -----------------------------------------------------------------------------

/**
 * Throw an exception that contains an errorText part and
 * an expected text part.
 *
 * @param {string} [errorText] - Message that describes the error
 *
 * @param {string} [expectedText] - Text that describes what was expected
 *
 * @param {string} [value]
 *   If supplied the value will be used to generate a "typeof" text, which
 *   describes the type of the value that was encountered
 */
export function expected( errorText, expectedText, value )
{
  if( !errorText && !expectedText )
  {
    throw new Error('Missing parameter [errorText] or [expectedText]');
  }

  if( 3 === arguments.length )
  {
    // value supplied => generate typeof text

    if( expectedText )
    {
      expectedText = `${expectedText}, got [${type(value)}]`;
    }
    else {
      expectedText = `got [${type(value)}]`;
    }
  }

  if( !errorText )
  {
    // No error text => use expected text as error message

    throw new TypeOrValueError( expectedText );
  }

  if( !errorText.includes('(expected') )
  {
    // Combine error text and expected text into a single error message
    throw new TypeOrValueError( `${errorText} (${expectedText})` );
  }
  else {
    // errorText already contains and expected text part
    throw new TypeOrValueError( errorText );
  }
}

/* -------------------------------------------------------- expect... exports */

/**
 * Expect a value to be defined
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectDefined( value, errorText )
{
  if( typeof value === 'undefined' )
  {
    expected( errorText,
      'expected a definined value' );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value not to be null
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectNotNull( value, errorText )
{
  if( value !== null )
  {
    return;
  }

  expected( errorText, 'expected null', value );
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be an Array
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectArray( value, errorText )
{
  if( !(value instanceof Array) )
  {
    expected( errorText, 'expected array', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be a not empty Array
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectNotEmptyArray( value, errorText )
{
  if( !(value instanceof Array) || !value.length )
  {
    expected( errorText, 'expected not empty array', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be like an Array (an object that has a length property)
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectArrayLike( value, errorText )
{
  if( !(value instanceof Object) || undefined === value.length )
  {
    expected( errorText, 'expected array-like object', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be an ArrayBuffer
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectArrayBuffer( value, errorText )
{
  if( typeof value === 'function' )
  {
    expected( errorText,
      'expected Object, not a function' );
  }

  if( !(value instanceof ArrayBuffer) )
  {
    expected( errorText, 'expected ArrayBuffer', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be an Array of strings
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectArrayOfStrings( value, errorText )
{
  if( !(value instanceof Array) )
  {
    expected( errorText, 'expected array of strings', value );
  }

  // -- Check if all array items are strings

  for( let j = 0, n = value.length; j < n; j = j + 1 )
  {
    if( typeof value[ j ] !== 'string' )
    {
      expected( errorText,
        `expected array value [${j}] to be a string`, value[ j ] );
    }
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be an Array or undefined
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectArrayOrUndefined( value, errorText )
{
  if( undefined !== value && !(value instanceof Array) )
  {
    expected( errorText, 'expected array or undefined', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to implement the iterator protocol
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 *
 * @see
 *    https://developer.mozilla.org/en-US/
 *    docs/Web/JavaScript/Reference/Iteration_protocols
 *
 * @see
 *    https://stackoverflow.com/questions/6863182/
 *    what-is-the-difference-between-iterator-and-iterable-and-how-to-use-them
 */
export function expectAsyncIterator( value, errorText )
{
  if( !(value instanceof Object) ||
      typeof value[ Symbol.asyncIterator ] !== 'function' )
  {
    expected( errorText, 'expected async iterator', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be a boolean
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectBoolean( value, errorText )
{
  if( typeof value !== 'boolean' )
  {
    expected( errorText, 'expected boolean', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be a function
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectFunction( value, errorText )
{
  if( typeof value !== 'function' )
  {
    expected( errorText, 'expected function', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be a class
 * - Actually checks if the value is a function
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectClass( value, errorText )
{
  if( typeof value !== 'function' )
  {
    expected( errorText, 'expected function or class', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be iterable (should implement the iterator protocol)
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 *
 * @see
 *    https://developer.mozilla.org/en-US/
 *    docs/Web/JavaScript/Reference/Iteration_protocols
 *
 * @see
 *    https://stackoverflow.com/questions/6863182/
 *    what-is-the-difference-between-iterator-and-iterable-and-how-to-use-them
 */
export function expectIterable( value, errorText )
{
  if( !(value instanceof Object) ||
      typeof value[ Symbol.iterator ] !== 'function' )
  {
    expected( errorText, 'expected Iterable', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be an Iterator object
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 *
 * @see
 *    https://developer.mozilla.org/en-US/
 *    docs/Web/JavaScript/Reference/Iteration_protocols
 *
 * @see
 *    https://stackoverflow.com/questions/6863182/
 *    what-is-the-difference-between-iterator-and-iterable-and-how-to-use-them
 */
export function expectIterator( value, errorText )
{
  if( !(value instanceof Object) ||
       typeof value.next !== 'function' )
  {
    expected( errorText, 'expected iterator', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be a not-empty string
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectNotEmptyString( value, errorText )
{
  if( typeof value !== 'string' )
  {
    expected( errorText, 'expected not empty string', value );
  }

  if( !value.length )
  {
    expected( errorText, 'expected not empty string, got empty string');
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be a store instance
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectStore( value, errorText )
{
  if( !(value instanceof Object || (value && typeof value === 'object') ) ||
      typeof value.subscribe !== 'function' )
  {
    expected( errorText, 'expected store', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be an Arango collection id
 * - A collection id is formatted as <CollectionName>/<key>
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectArangoCollectionId( value, errorText )
{
  if( typeof value !== 'string' )
  {
    expected( errorText, 'expected not empty string', value );
  }

  const x = value.indexOf('/');

  if( -1 === x || x === value.length - 1 )
  {
    expected( errorText, 'expected collection id (invalid string)');
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be a valid URI component
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectUriComponent( value, errorText )
{
  if( typeof value !== 'string' )
  {
    expected( errorText,
      'expected URI component', value );
  }

  if( !RE_URI_COMPONENT.test( value ) )
  {
    expected( errorText,
      'expected URI component (invalid character found)');
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be a not-empty string or null
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectNotEmptyStringOrNull( value, errorText )
{
  if( typeof value !== 'string' && null !== value )
  {
    expected( errorText,
      'expected not empty string or null', value );
  }

  if( value !== null && !value.length )
  {
    expected( errorText,
      'expected not empty string or null, got empty string');
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be a number
 * - NaN is not considered a valid number
 * - Infinity
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectNumber( value, errorText )
{
  if( typeof value !== 'number' )
  {
    expected( errorText,
      'expected number', value );
  }

  if( Number.isNaN(value) )
  {
    expected( errorText,
      '(expected number, got [NaN]' );
  }

  // TODO: What to do with Infinity and -Infinity?
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be a number and greater than zero
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectPositiveNumber( value, errorText )
{
  if( typeof value !== 'number' ||
      value <= 0 ||
      Number.isNaN( value ) )
  {
    expected( errorText,
      'expected positive number', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be a number and greater or equal to zero
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectNotNegativeNumber( value, errorText )
{
  if( typeof value !== 'number' ||
      value < 0 ||
      Number.isNaN( value ) )
  {
    expected( errorText, 'expected not negative number', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be an integer and greater or equal to zero
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectPositiveInteger( value, errorText )
{
  if( typeof value !== 'number' ||
      value < 0 ||
      !Number.isInteger( value ) ||
      Number.isNaN( value ) )
  {
    expected( errorText, 'expected positive integer', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be an integer and greater or equal to zero
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectNotNegativeInteger( value, errorText )
{
  if( typeof value !== 'number' ||
      value < 0 ||
      !Number.isInteger( value ) ||
      Number.isNaN( value ) )
  {
    expected( errorText, 'expected not negative integer', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be an Object
 * - A Function is also an Object
 * - A Promise is NOT assumed a value object
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectObject( value, errorText )
{
  if( !(value instanceof Object || (value && typeof value === 'object') ) ||
      value instanceof Promise )
  {
    expected( errorText, 'expected object', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be an Object, but not an array
 * - A Promise is not considered a valid object
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectObjectNoArray( value, errorText )
{
  if( !(value instanceof Object || (value && typeof value === 'object') ) ||
       (value instanceof Promise) ||
       Array.isArray(value) )
  {
    expected( errorText,
      'expected object but not an array', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be an Object, but not a function
 * - A Promise is not considered a valid object
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectObjectNoFunction( value, errorText )
{
  if( !(value instanceof Object || (value && typeof value === 'object') ) ||
       (value instanceof Promise) ||
       typeof value === 'function' )
  {
    expected( errorText,
      'expected object but not a function', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be an Object or null
 * - A Promise is not considered a valid object
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectObjectOrNull( value, errorText )
{
  if( value === null )
  {
    return;
  }

  if( !(value instanceof Object || typeof value === 'object') ||
       (value instanceof Promise) )
  {
    expected( errorText, 'expected object or null', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be an Object or undefined
 * - A Promise is not considered a valid object
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectObjectOrUndefined( value, errorText )
{
  if( value === undefined )
  {
    return;
  }

  if( !(value instanceof Object || (value && typeof value === 'object') ) ||
       (value instanceof Promise) )
  {
    expected( errorText,
      'expected object or undefined', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be an Object or a string
 * - A Promise is not considered a valid object
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectObjectOrString( value, errorText )
{
  if( value === undefined )
  {
    return;
  }

  const notAnObject =
    !(value instanceof Object || (value && typeof value === 'object') ) ||
     (value instanceof Promise);

  if( notAnObject && typeof value !== 'string' )
  {
    expected( errorText,
      'expected object or string', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be an object path
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectObjectPath( value, errorText )
{
  if( typeof value === 'string' )
  {
    return;
  }

  if( !(value instanceof Array) )
  {
    expected(
      errorText,
      'expected object path (string or array of strings)',
      value );
  }

  // -- Check if all array items are strings

  for( let j = 0, n = value.length; j < n; j = j + 1 )
  {
    if( typeof value[ j ] !== 'string' )
    {
      expected(
        errorText,
        `expected array object path value [${j}] to be a string`,
        value[ j ] );
    }
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be a Promise
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectPromise( value, errorText )
{
  if( !(value instanceof Promise) )
  {
    expected( errorText, 'expected Promise', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be a Map
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectMap( value, errorText )
{
  if( !(value instanceof Map) )
  {
    expected( errorText, 'expected Map', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be a Set
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectSet( value, errorText )
{
  if( !(value instanceof Set) )
  {
    expected( errorText, 'expected Set', value );
  }
}


// -----------------------------------------------------------------------------

/**
 * Expect a value to be an Array or a Set
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectArrayOrSet( value, errorText )
{
  if( !(value instanceof Array) && !(value instanceof Set) )
  {
    expected( errorText, 'expected Array or Set', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be a Set that only contains strings
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectSetOfStrings( value, errorText )
{
  if( !(value instanceof Set) )
  {
    expected( errorText, 'expected Set of strings', value );
  }

  // -- Check all values in Set

  for( const current of value.values() )
  {
    if( typeof current !== 'string' )
    {
      expected( errorText,
        'expected all Set values to be strings', current );
    }
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be a string
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectString( value, errorText )
{
  if( typeof value !== 'string' )
  {
    expected( errorText, 'expected string', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be a string or an Array that only contains strings
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectStringOrArrayOfStrings( value, errorText )
{
  if( !(value instanceof Array) )
  {
    if( typeof value === 'string' )
    {
      // A string is ok -> done
      return;
    }

    expected( errorText, 'expected string or array of strings', value );
  }

  // -- Check if all array items are strings

  for( let j = 0, n = value.length; j < n; j = j + 1 )
  {
    if( typeof value[ j ] !== 'string' )
    {
      expected( errorText,
        `expected array value [${j}] to be a string`, value[ j ] );
    }
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be a string or null
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectStringOrNull( value, errorText )
{
  if( typeof value !== 'string' && null !== value )
  {
    expected( errorText, 'expected string or null', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be a string or undefined
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectStringOrUndefined( value, errorText )
{
  if( typeof value !== 'string' && undefined !== value )
  {
    expected( errorText, 'expected string or undefined', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be a Symbol
 * - Throws an Exception if the parameter [value] is not a Symbol
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectSymbol( value, errorText )
{
  if( typeof value !== 'symbol' )
  {
    expected( errorText, 'expected symbol', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be a Symbol or a string
 * - Throws an Exception if the parameter [value] is not a Symbol or a string
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectNotEmptyStringOrSymbol( value, errorText )
{
  if( typeof value !== 'symbol' && typeof value !== 'string' )
  {
    expected( errorText, 'expected symbol or string', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be an Error instance
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
export function expectError( value, errorText )
{
  if( !(value instanceof Error) )
  {
    expected( errorText, 'expected an Error instance', value );
  }
}

// -----------------------------------------------------------------------------

/**
 * Expect a value to be an Error instance or an error message (string)
 *
 * @param {mixed} value - Value to check
 * @param {string} errorText - Text of the error to throw
 */
// export function expectErrorOrMessage( value, errorText )
// {
//   if( !(value instanceof Error) &&
//       !(typeof value === "string" && value.length !== 0) )
//   {
//     expected( errorText,
//       "expected an Error instance or error message (string)" );
//   }
// }
