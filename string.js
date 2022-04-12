
/* ------------------------------------------------------------------ Imports */

// let expect;
// let object_get;
// let proc;

// export function stdModuleInit()
// {
//   expect = std.expect;
//   object_get = std.object_get;
//   proc = std.proc;

//   proc.arrayToStringPathWeakMap = new WeakMap();
//   proc.safeArrayPathsWeakMap = new WeakMap();
// }

/* ---------------------------------------------------------------- Internals */

// const EXPRESSION_REGEXP = /\$\{([^${}]*)\}/g;

/* ------------------------------------------------------------------ Exports */

// ---------------------------------------------------------------------- Method

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
 * - Uses es6 template style expression substitution
 * - Variables and expressions are surrounded by ${...}
 *
 * @param {string} template - Template string to interpolate
 * @param {object} templateData - Template data to use for interpolation
 */
// export function interpolate( template, templateData )
// {
//   expect.string( template, "Missing or invalid variable [template]" );
//   expect.object( templateData, "Missing or invalid variable [values]" );

//   return template.replace( EXPRESSION_REGEXP,
//     function( match, expression )
//     {
//       let replacement;

//       // std.debug( { match, expression});

//       let path = expression;
//       replacement = object_get( templateData, path, undefined);

//       // if( RE_VARIABLE_ONLY.test( expression ) )
//       // {
//       //   let path = expression;
//       //   replacement = hk.objectGet( templateData, path, undefined);
//       // }
//       // else {
//       //   // Expression is more that just a single variable
//       //
//       //   replacement = "TODO";
//       //
//       //   //
//       //   // // Replace all variables in the expression by values
//       //   //
//       //   // // let tmp =
//       //   // //   expression.replace(/[[a-zA-Z_$][0-9a-zA-Z_$]*/g,
//       //   // //     function( path )
//       //   // //   {
//       //   // //     std.debug( { path, templateData } );
//       //   // //     return hk.objectGet( templateData, path, undefined);
//       //   // //   } );
//       //   // //
//       //   // // std.debug( { tmp } );
//       //   // //
//       //   // // replacement = tmp;
//       //   //
//       //   // if( expression.indexOf("&&") !== -1 )
//       //   // {
//       //   //   // std.debug( expression );
//       //   //   // replacement = looseJsonParse( "1 + 1" );
//       //   //
//       //   //   replacement = looseJsonParse( expression, templateData );
//       //   //
//       //   //   std.debug("JENS2", { replacement });
//       //   // }
//       //   // else {
//       //   //   let path = expression;
//       //   //   replacement = hk.objectGet( templateData, path, undefined);
//       //   // }
//       // }

//       // std.debug("Replace:", expression + " -> " + replacement, templateData);

//       if( typeof replacement !== "string" &&
//           typeof replacement !== "number" &&
//           typeof replacement !== "boolean" )
//       {
//         throw new Error(
//           "Template interpolation: Missing or invalid value for "+
//           "template expression ["+expression+"] "+
//           "(expected string, number or boolean)");
//       }

//       return replacement;
//     } );
// }

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
