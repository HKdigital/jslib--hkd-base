
/* ------------------------------------------------------------------ Imports */

import { expectString,
         expectObject } from "@hkd-base/helpers/expect.js";

import { objectGet } from "@hkd-base/helpers/object.js";

/* ---------------------------------------------------------------- Internals */

const EXPRESSION_REGEXP = /\$\{([^${}]*)\}/g;

/* ------------------------------------------------------------------ Exports */

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

// ---------------------------------------------------------------------- Method

/**
 * Interpolate: substitute variables in a string
 *
 * - Uses es6 template style expression substitution:
 *   Variables and expressions are surrounded by ${...}
 *
 * --
 *
 * @eg const template = `Hello ${name}`;
 *
 * --
 *
 * @param {string} template - Template string to interpolate
 * @param {object} templateData - Template data to use for interpolation
 */
export function interpolate( template, templateData )
{
  expectString( template, "Missing or invalid variable [template]" );
  expectObject( templateData, "Missing or invalid variable [templateData]" );

  return template.replace( EXPRESSION_REGEXP,

    // eslint-disable-next-line no-unused-vars
    function( match, expression )
    {
      let replacement;

      let path = expression;

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

// ---------------------------------------------------------------------- Method

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
