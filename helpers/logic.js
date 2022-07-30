
import { toArrayPath } from "@hkd-base/helpers/array.js";

import { smallestFirst, compareUsingKey } from "@hkd-base/helpers/compare.js";

import { objectGet, PATH_SEPARATOR } from "@hkd-base/helpers/object.js";

/* ---------------------------------------------------------------- Internals */

class Logic {}

class TruthyOrSelector extends Logic
{
  /**
   * Create an instance that holds a list of paths that should contain
   * truthy values when applied to a test object
   */
  constructor()
  {
    super();

    if( 1 === arguments &&
        Array.isArray( arguments[0] ) )
    {
      this.paths = this._createPathsSet( arguments[0] );
    }
    else {
      this.paths = this._createPathsSet( arguments );
    }
  }

  /**
   * Test if one of the values at the selector paths is truthy
   *
   * @param {object} obj
   *
   * @returns {boolean}
   *   true if one of the selected values in the object is truthy
   */
  test( obj )
  {
    const paths = this.paths;

    if( typeof obj !== "object" )
    {
      throw new Error("Invalid parameter [obj]");
    }

    for( let path of paths.values() )
    {
      if( /* truthy */ objectGet( obj, path ) )
      {
        return true;
      }
    } // end for

    return false;
  }

  /**
   * Returns a human friendly string that explains the logic applied by
   * this object.
   */
  explain()
  {
    let str = "";

    for( const path of this.paths.values() )
    {
      str += ` OR "${path.join( PATH_SEPARATOR )}"`;
    }

    return str.slice( 4 ); // remove " OR " from start of string
  }

  /**
   * Returns a Set that contains all paths
   * - Paths that contain the least mumber of path parts are added first
   *   to the Set
   *
   * @param {string[]} paths
   *
   * @returns {Set} set of paths
   */
  _createPathsSet( listOfPaths )
  {
    let tmp = [];

    for( let j = 0, n = listOfPaths.length; j < n; j = j + 1 )
    {
      const path = toArrayPath( listOfPaths[ j ] );

      tmp.push( path);
    }

    tmp.sort( compareUsingKey.bind( null, smallestFirst, "length" ) );

    return new Set( tmp );
  }
}

/* ------------------------------------------------------------------ Exports */

export { Logic };

// -----------------------------------------------------------------------------

/**
 * Create an OR element that can be used to check if one of the values at the
 * specified paths is truthy
 *
 * @returns {object} logic OR element
 */
export function OR()
{
  // TODO: also allow to build other selectors than "truthy or"

  return new TruthyOrSelector( ...arguments );
}

// -----------------------------------------------------------------------------

/**
 * Create a logic AND element
 *
 * @returns {object} logic AND element
 */
// export function AND()
// {
//   return new AndValues( ...arguments );
// }
