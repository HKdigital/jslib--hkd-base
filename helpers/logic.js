
import { toArrayPath } from '@hkd-base/helpers/array.js';

import { smallestFirst, compareUsingKey } from '@hkd-base/helpers/compare.js';

import { objectGet, PATH_SEPARATOR } from '@hkd-base/helpers/object.js';

/* ---------------------------------------------------------------- Internals */

/**
 * Base class for all logic components
 * - Can be used to check if a variable is a "Logic" object (use instanceof)
 */
class Logic {

  /**
   * Creates a Logic instance
   * - The arguments are converted into a Set of paths that should be checked
   *   by the class that inherits from the Logic instance
   *
   * @param {string[]|(...string|...string[])}
   *   Array path or multiple (array) paths
   */
  constructor()
  {
    if( 1 === arguments &&
        Array.isArray( arguments[0] ) )
    {
      //
      // Single array as argument: use as array path
      //
      this.paths = this._createPathsSet( arguments[0] );
    }
    else {
      //
      //  Multiple (array) paths
      //
      this.paths = this._createPathsSet( arguments );
    }
  }

  /* ------------------------------------------------------- Internal methods */

  /**
   * Returns a Set that contains all paths
   * - Paths that contain *the smallest number of path parts* are added first
   *   to the Set. The first paths in the Set are evaluated first. Paths with
   *   a smaller amount of path parts should be faster to evaluate.
   *
   *
   * @param {string[]} paths
   *
   * @returns {Set} set of paths
   */
  _createPathsSet( listOfPaths )
  {
    const tmp = [];

    for( let j = 0, n = listOfPaths.length; j < n; j = j + 1 )
    {
      const path = toArrayPath( listOfPaths[ j ] );

      tmp.push( path);
    }

    tmp.sort( compareUsingKey.bind( null, smallestFirst, 'length' ) );

    return new Set( tmp );
  }
}

/* -------------------------------------------------- class: TruthyOrSelector */

class TruthyOrSelector extends Logic
{
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

    if( typeof obj !== 'object' )
    {
      throw new Error('Invalid parameter [obj]');
    }

    for( const path of paths.values() )
    {
      if( /* truthy */ objectGet( obj, path ) )
      {
        return true;
      }
    } // end for

    return false;
  }

  // ---------------------------------------------------------------------------

  /**
   * Returns a human friendly string that explains the logic applied by
   * this object.
   */
  explain()
  {
    let str = '';

    for( const path of this.paths.values() )
    {
      str += ` OR "${path.join( PATH_SEPARATOR )}"`;
    }

    return str.slice( 4 ); // remove " OR " from start of string
  }

}

/* ------------------------------------------------- class: TruthyAndSelector */

class TruthyAndSelector extends Logic
{
  /**
   * Test if all the values at the selector paths are truthy
   *
   * @param {object} obj
   *
   * @returns {boolean}
   *   true if one of the selected values in the object is truthy
   */
  test( obj )
  {
    const paths = this.paths;

    if( typeof obj !== 'object' )
    {
      throw new Error('Invalid parameter [obj]');
    }

    for( const path of paths.values() )
    {
      if( /* not truthy */ !objectGet( obj, path ) )
      {
        return false;
      }
    } // end for

    // All values at all selector paths are thruthy

    return true;
  }

  // ---------------------------------------------------------------------------

  /**
   * Returns a human friendly string that explains the logic applied by
   * this object.
   */
  explain()
  {
    let str = '';

    for( const path of this.paths.values() )
    {
      str += ` AND "${path.join( PATH_SEPARATOR )}"`;
    }

    return str.slice( 5 ); // remove " AND " from start of string
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
export function AND()
{
  return new TruthyAndSelector( ...arguments );
}

