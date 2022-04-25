
/* ------------------------------------------------------------------ Imports */

import { expectString } from "../expect.js";

/* ------------------------------------------------------------------ Exports */

export const SEPARATOR = "/";

// ---------------------------------------------------------------------- Method

/**
 * Get the path without the extension part
 *
 * @param {string} path
 *
 * @returns {string} path without the extension
 */
export function stripExtension( path )
{
  expectString( path, "Missing or invalid parameter [path]" );

  const x = path.lastIndexOf(".");

  if( x <= 0 )
  {
    return path;
  }

  return path.slice( 0, x );
}

// ---------------------------------------------------------------------- Method

/**
 * Get the basename from a path
 *
 * e.g.
 *   basename('/foo/bar/baz/asdf/quux.html');
 *   => returns: 'quux.html'
 *
 * @param {string} path
 *
 * @returns {string} basename
 */
export function basename( path, stripExtension_=false, separator=SEPARATOR )
{
  expectString( path, "Missing or invalid parameter [path]" );

  const x = path.lastIndexOf( separator );

  if( x > 0 )
  {
    path = path.slice( x + 1 );
  }

  if( stripExtension_ )
  {
    return stripExtension( path );
  }

  return path;
}