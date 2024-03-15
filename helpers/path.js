
/* ------------------------------------------------------------------ Imports */

import { expectString }
  from "@hkd-base/helpers/expect.js";

/* ---------------------------------------------------------------- Internals */

/**
 * Get the path without the extension part
 *
 * @param {string} path
 *
 * @returns {string} path without the extension
 */
function stripExtensionFn( path )
{
  expectString( path, "Missing or invalid parameter [path]" );

  const x = path.lastIndexOf(".");

  if( x <= 0 )
  {
    return path;
  }

  return path.slice( 0, x );
}

/* ------------------------------------------------------------------ Exports */

export const DEFAULT_SEPARATOR = "/";

export { stripExtensionFn as stripExtension };

// -----------------------------------------------------------------------------

/**
 * Get the basename from a path
 *
 * @param {string} path
 *   Path to get the base name from
 *
 * @param {string} [options.stripExtension=false]
 *   Is set to true, the extension is also removed from the basename
 *
 * @param {string} [options.separator=DEFAULT_SEPARATOR]
 *   The separator that is used in the path
 *
 * @e.g.
 *   basename('/foo/bar/baz/asdf/quux.html');
 *     => returns: 'quux.html'
 *
 *   basename('/foo/bar/baz/asdf/quux.html', );
 *     => returns: 'quux.html'

 */
export function basename( path, options )
{
  expectString( path, "Missing or invalid parameter [path]" );

  const x = path.lastIndexOf( options ? options.separator : DEFAULT_SEPARATOR );

  if( x > 0 )
  {
    path = path.slice( x + 1 );
  }

  if( options && options.stripExtension )
  {
    return stripExtensionFn( path );
  }

  return path;
}
