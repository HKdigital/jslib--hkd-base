
/* ------------------------------------------------------------------ Imports */

import { expectString,
         expectObject } from "./expect.js";

import { objectGet,
         PATH_SEPARATOR } from "./object.js";

import { toArrayPath } from "./array.js";

/* ---------------------------------------------------------------- Internals */

/* ------------------------------------------------------------------ Exports */

export const RE_JS_EXPRESSION = /\$\{([^${}]*)\}/g;
export const RE_MUSTACHE = /\{\{([^{}]*)\}\}/g;

// -----------------------------------------------------------------------------

/**
 * Captizalize the first letter of a string
 *
 * @param {string} str - Input string
 *
 * @returns {string} string with first letter capitalized
 */
export function capitalizeFirstLetter( str )
{
  if( !str.length )
  {
    return str;
  }

  return str.charAt(0).toUpperCase() + str.slice(1);
}

// -----------------------------------------------------------------------------

/**
 * Interpolate: substitute variables in a string
 *
 * - Uses mustache template style expression substitution:
 *   Variables and expressions are surrounded by {{...}}
 *
 *  TODO: full mustache support, see https://github.com/janl/mustache.js
 *
 * --
 *
 * @eg const template = `Hello {{name}}`;
 *
 * --
 *
 * @param {string} template - Template string to interpolate
 * @param {object} templateData - Template data to use for interpolation
 *
 * @returns {string} interpolated string
 */
export function interpolate(
  template,
  templateData,
  expressionRegexp=RE_MUSTACHE )
{
  expectString( template,
    "Missing or invalid variable [template]" );

  expectObject( templateData,
    "Missing or invalid variable [templateData]" );

  return template.replace( expressionRegexp,

    // eslint-disable-next-line no-unused-vars
    function( match, expression )
    {
      let replacement;

      let path = toArrayPath( expression );

      replacement = objectGet( templateData, path, undefined);

      if( typeof replacement !== "string" &&
          typeof replacement !== "number" &&
          typeof replacement !== "boolean" )
      {
        throw new Error(
          `Failed to interpolate template: Missing or invalid value for ` +
          `expression [${expression}] (expected string, number or boolean)`);
      }

      return replacement;
    } );
}

// -----------------------------------------------------------------------------

/**
 * Remove strange characters from a string and replace whitespace by
 * dashes.
 *
 * @returns {string} string that can be used as uri
 */
export function toUriName( str )
{
  expectString( str,
    "Missing or invalid variable [str]" );

  str = str.toLowerCase().replace(/[^a-z0-9]+/ig, "-");

  // TODO: remove duplicate dashes

  return str;
}

// -----------------------------------------------------------------------------

/**
 * Convert a path string to an array path
 * - The path string will be spit at the `pathSeparator` token
 * - If the supplied path is already an array, the original array will
 *   be returned
 *
 * @param {string|string[]} path
 *   String or array path (e.g. "some.path.to")
 *
 * @param {string} [pathSeparator=PATH_SEPARATOR]
 *   A custom path separator to use instead of the default "."
 *
 * @returns {string[]} array path (e.g. ["some", "path", "to"])
 */
export function toStringPath( path, pathSeparator=PATH_SEPARATOR )
{
  if( Array.isArray( path ) )
  {
    return path.join( pathSeparator );
  }
  else if( typeof path === "string" )
  {
    // path is already a string
    return path;
  }
  else {
    throw new Error(
      "Missing or invalid parameter [path] (expected string or array)");
  }
}

// -----------------------------------------------------------------------------

/**
 * Prefix a numeric string with 0's
 *
 * @param {string|number} input
 *
 * @returns {string}
 */
export function padDigits( input, targetLength=2, padString="0" )
{
  return ("" + input).padStart( targetLength, padString);
}

// -----------------------------------------------------------------------------

/**
 * Make sure that the outputted path is an array path
 * - The input value may be a array path
 * - The input value may be a string path (no conversion needed)
 *
 * @param {string|string[]} path
 *
 * @returns {string[]} array path (list of strings)
 */
// export function fromPath( path )
// {
//   if( typeof path === "string" )
//   {
//     return path;
//   }
//   else {
//     expect.array( path,
//       "Missing or invalid parameter [path] (expected string or string[])" );

//     let strPath = proc.arrayToStringPathWeakMap.get( path );

//     if( strPath )
//     {
//       // std.debug( "Using cached value", path );
//       return strPath;
//     }

//     // Check array path
//     for( let j = 0, n = path.length; j < n; j = j + 1 )
//     {
//       if( typeof path[j] !== "string" )
//       {
//         throw new Error("Invalid array path. Expected array of strings");
//       }
//     }

//     strPath = path.join("/");

//     proc.safeArrayPathsWeakMap.set( path, true );
//     proc.arrayToStringPathWeakMap.set( path, strPath );

//     return strPath;
//   }
// }
