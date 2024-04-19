
/* ------------------------------------------------------------------ Imports */

import {
  expectArray,
  expectArrayOfStrings} from './expect.js';

import { isObject } from './is.js';

import { objectSet } from './object.js';

/* ------------------------------------------------------------------ Exports */

/**
 * Convert an array of objects (items) to a single object
 * - All items will be added to a single object by using a key value of the
 *   item.
 *
 * @eg
 *   const input = [ { label: "one", value: 1 }, { label: "two", value: 2 } ];
 *
 *   arrayToTree( input, "label" ) =>
 *
 *   {
 *     "one": { label: "one", value: 1 },
 *     "two": { label: "two", value: 2 }
 *   }
 *
 * @param {object[]} arr
 * @param {string|string[]} pathKeyOrKeys
 *
 * @returns {object} object that contains all array items by key
 */
export function arrayToTree( items, pathKeyOrKeys )
{
  expectArray( items, 'Missing or invalid parameter [items]' );

  let pathKeys;

  if( typeof pathKeyOrKeys === 'string' )
  {
    pathKeys = [ pathKeyOrKeys ];
  }
  else {
    expectArrayOfStrings( pathKeyOrKeys,
      'Missing or invalid parameter [pathKeyOrKeys]' );

    pathKeys = pathKeyOrKeys;
  }

  const pathLength = pathKeys.length;

  const obj = {};

  for( let j = 0, n = items.length; j < n; j = j + 1 )
  {
    const item = items[j];

    if( !isObject(item) )
    {
      throw new Error(
        `Invalid parameter [items]. [ item[${j}] ] should be an object`);
    }

    // Create path

    const path = [];

    for( let j = 0; j < pathLength; j = j + 1 )
    {
      const key = pathKeys[ j ];
      const keyValue = item[ key ];

      if( typeof keyValue !== 'string' )
      {
        throw new Error(
          `Invalid parameter [items]. [ item[${j}][${key}] ] ` +
          'should be a string');
      }

      path.push( keyValue );

    } // end for

    // Set item in object at path

    objectSet( obj, path, item );

  } // end for

  return obj;
}

// ---------------------------------------------------------------------- Method


// TODO: getTreeLeaves: function to get items from tree leaves


