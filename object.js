
/* ------------------------------------------------------------------ Imports */

import {
  expectString,
  expectObject,
  expectArray,
  expectDefined,
  expectObjectNoFunction } from "$hk/expect.js";

import { equals } from "$hk/compare.js";

import { toArrayPath } from "$hk/array.js";

import { isIterable } from "$hk/is.js";

import { iterateObjectPaths, iterateObjectEntries } from "$hk/iterate.js";

// ------------------------------------------------------------------- Internals

const PATH_SEPARATOR = ".";

/**
 * Create a human friendly string representation of an array path
 * - Allows for removal of the last part of the array part
 *
 * @param {string[]} arr - Array path to join
 * @param {number} [lastIndex]
 *   If specified, only parts up and including the last index will
 *   be joined
 *
 * @returns {string} path as string
 */
function display_array_path( arr, lastIndex )
{
  return arr.slice( 0, lastIndex ).join( PATH_SEPARATOR );
}

const object_to_string = Object.prototype.toString;
const has_own_property = Object.prototype.hasOwnProperty;

/* ------------------------------------------------------------------ Exports */

export { PATH_SEPARATOR };

// ---------------------------------------------------------------------- Method

/**
 * Returns true if the object has no (iterable) key value pairs
 *
 * @param {object} obj
 *
 * @return {boolean}
 *   true if the object has no key value pairs or the supplied object
 *   is `falsey`
 */
export function isEmpty( obj )
{
  if( !obj )
  {
    // object is null or other falsey value
    return true;
  }

  expectObject( obj, "Invalid parameter [obj]" );

  for( const key in obj )
  {
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------- Method

/**
 * Get the number of (iterable) key value pairs in the specified object
 *
 * @param {object} obj
 *
 * @return {number} number of iterable key value pairs
 */
export function objectSize( obj )
{
  expectObject( obj, "Invalid parameter [obj]" );

  let count = 0;

  /* eslint-disable no-unused-vars */
  for( const key in obj )
  {
    count = count + 1;
  }
  /* eslint-enable no-unused-vars */

  return count;
}

// ---------------------------------------------------------------------- Method

/**
 * Freezes an object recursively
 * - Allows non-objects to be passed as input parameter (non-objects are
 *   immutable by default).
 *
 * @param {mixed} value
 *
 * @returns {mixed}
 *   recursively frozen object or original input value if a non-object was
 *   supplied as input parameter
 */
export function deepFreeze( value, _found )
{
  if( !(value instanceof Object) )
  {
    return value;
  }

  if( !_found )
  {
    _found = new Set();
  }
  else if( _found.has( value ) )
  {
    // Using recursion -> no need to return value
    return;
  }

  _found.add( value );

  Object.freeze( value );

  for( let key in value )
  {
    let childObj = value[ key ];

    if( childObj instanceof Object )
    {
      // Recurse into child objects
      deepFreeze( childObj, _found );
    }
  } // end for

  return value;
}

// ---------------------------------------------------------------------- Method

/**
 * Set a value in an object using a path and value pair.
 * - Automatically creates parent objects
 *
 * @param {object} obj - Object to set the value in
 * @param {string|Array} path - Dot separated string path or array path
 * @param {mixed} value - value to set
 *
 * @returns {boolean} true if the value was changed
 */
export function objectSet( obj, path, value )
{
  expectObject( obj, "Missing or invalid parameter [obj]");

  const arrPath = toArrayPath( path );

  if( arguments.length < 3 )
  {
    throw new Error("Missing or invalid parameter [value]");
  }

  let parentNode;
  const lastKey = arrPath[ arrPath.length - 1 ];

  if( value !== undefined )
  {
    parentNode = _ensureParent( obj, arrPath );
  }
  else {
    //
    // value is undefined -> delete node
    //
    parentNode = _getParent( obj, arrPath );

    if( Array.isArray(parentNode) )
    {
      const keyAsInt = parseInt( lastKey, 10 );

      if( Number.isNaN(keyAsInt) )
      {
        throw new Error(
          "Cannot delete property [" + arrPath.join( PATH_SEPARATOR ) + "] " +
          "from data node of type [Array]");
      }

      if( keyAsInt < parentNode.length )
      {
        parentNode.splice( keyAsInt, 1 );
        return true;
      }

      return false;
    }
    else if( parentNode )
    {
      if( lastKey in parentNode )
      {
        delete parentNode[ lastKey ];
        return true;
      }
      return false;
    }
  }

  // -- Set value

  const existingValue = parentNode[ lastKey ];

  if( !equals( value, existingValue ) )
  {
    parentNode[ lastKey ] = value;

    return true;
  }

  return false;
}

// ---------------------------------------------------------------------- Method

/**
 * Removes a value at the specified object path from the object.
 * - All parent objects that remain empty will be removed too (recursively)
 *
 * @param {object} obj - Object to set the value in
 * @param {string|Array} path - Dot separated string path or array path
 * @param {mixed} value - value to set
 */
export function deletePath( obj, path )
{
  expectObject( obj, "Missing or invalid parameter [obj]");

  const arrPath = toArrayPath( path );

  const n = arrPath.length;
  const n_1 = n - 1;

  if( !n )
  {
    // Path is empty ""
    return;
  }

  const lastKey = arrPath[ n_1 ];

  if( 1 === n )
  {
    // Path consist of a single key
    delete obj[ lastKey ];
    return;
  }

  // path is longer than a single key >>

  // -- Get parent objects

  const parents = [];

  let current = obj;

  let endValueFound = true;

  for( let j = 0; j < n; j = j + 1 )
  {
    if( !(current instanceof Object) )
    {
      break;
    }

    parents.push( current );

    const key = arrPath[j];

    // console.log(
    //   {
    //     current,
    //     key,
    //     next: current[ key ]
    //   } );

    if( !(key in current) )
    {
      // child not found -> no more parents
      endValueFound = false;
      break;
    }

    current = current[ key ];
  }

  // console.log( "parents", parents );

  // -- Delete value from direct parent

  const n_parents = parents.length - 1;

  if( endValueFound )
  {
    const lastParent = parents[ n_parents ];

    if( !Array.isArray(lastParent) )
    {
      delete lastParent[ lastKey ];
    }
    else {
      lastParent.splice( parseInt( lastKey, 10 ), 1 );
    }
  }

  // -- Remove empty parents

  for( let j = n_parents - 1; j >= 0; j = j - 1 )
  {
    const parent = parents[ j ];
    const key = arrPath[j];
    const child = parent[ key ];

    let childIsEmpty = false;

    if( Array.isArray( child ) )
    {
      // Child is array
      if( 0 === child.length )
      {
        childIsEmpty = true;
      }
    }
    else {
      // Child is object
      if( 0 === Object.keys( child ).length )
      {
        childIsEmpty = true;
      }
    }

    if( !childIsEmpty )
    {
      // done
      break;
    }

    // Remove empty child from parent

    if( !Array.isArray( parent ) )
    {
      delete parent[ key ];
      break;
    }
    else {
      parent.splice( parseInt( key, 10 ), 1 );
    }

  } // end for
}

// ---------------------------------------------------------------------- Method

/**
 * Get a value from an object using a path
 * - Returns a default
 *
 * @param {object} obj - Object to get the value from
 * @param {string|Array} path - Dot separated string path or array path
 *
 * @param {mixed} [defaultValue=undefined]
 *   Value to return if the value does not exist
 *
 * @return {mixed} value found at path, defaultValue or undefined
 */
export function objectGet( obj, path, defaultValue )
{
  expectObject( obj, "Missing or invalid parameter [obj]");

  const arrPath = toArrayPath( path );

  if( !path.length || (1 === path.length && !path[0].length) )
  {
    // "" or [""]
    return obj;
  }

  const parentNode = _getParent( obj, arrPath );

  if( !parentNode )
  {
    return defaultValue; // @note may be undefined
  }

  const lastKey = arrPath[ arrPath.length - 1 ];

  const value = parentNode[ lastKey ];

  if( typeof value === "undefined" )
  {
    return defaultValue;  // @note may be undefined
  }

  return value;
}

// ---------------------------------------------------------------------- Method

// DEV >>>>

/**
 * Get an iterator that returns the value of a path for each item (object)
 * in the list of objects
 *
 * @param {object[]} arr - Array of objects
 * @param {string|string[]} path - Dot separated string path or array path
 *
 * @param {object} [options] - options
 *
 * DEPRECEATED >>> NOT COMPATIBLE WITH LIGHTWEIGHT ITERATOR
 * @param {object} [options.unique=false] - Only return unique values
 *
 * @param {mixed} [options.defaultValue]
 *   Value to return if the value does not exist
 *
 * @returns {Iterator<mixed>} value at the specified path for each item
 */
// export function values( arr, path, options )
// {
//   if( !Array.isArray(arr) )
//   {
//     throw new Error("Missing or invalid parameter [arr] (expected Array)");
//   }

//   if( typeof path !== "string" && !Array.isArray(path) )
//   {
//     throw new Error(
//       "Missing or invalid parameter [path] (expected string or Array");
//   }

//   options = Object.assign(
//     {
//       unique: false,
//       defaultValue: undefined
//     },
//     options );

//   if( options.unique )
//   {
//     // Keep track of all values to prevent duplicates
//   }

//   throw new Error("NOT IMPLEMENTED YET");
// }

// <<< DEV

// ---------------------------------------------------------------------- Method

/**
 * Returns a list of differences between the object before and the object
 * after the changes.
 * - By default, the function returns changes for added, updated and removed
 *   properties
 *
 * @param {object} objBefore
 * @param {object} objAfter
 *
 * @param {object} options
 * @param {boolean} [options.ignoreAdd=false]
 * @param {boolean} [options.ignoreUpdate=false]
 * @param {boolean} [options.ignoreDelete=false]
 *
 * @param {boolean} [options.ignorePrivate=true]
 *   Ignore properties that start with an underscore e.g. _id or _updatedAt
 *
 * @param {boolean} [options.deleteValue=null]
 *
 * @returns {array}
 *   List of changes between the object before and object after
 */
export function objectDiff( objBefore, objAfter, options={}, _recursion )
{
  const changes = [];

  const ignoreAdd =
    undefined === options.ignoreAdd ? false : options.ignoreAdd;

  const ignoreUpdate =
    undefined === options.ignoreUpdate ? false : options.ignoreUpdate;

  const ignoreDelete =
    undefined === options.ignoreDelete ? false : options.ignoreDelete;

  const ignorePrivate =
    undefined === options.ignorePrivate ? true : options.ignorePrivate;

  let deleteValue = null;

  if( "deletevalue" in options )
  {
    // Might be [undefined]
    deleteValue = options.deleteValue;
  }

  objBefore = objBefore || {};

  for( const key in objAfter )
  {
    if( ignorePrivate && key.startsWith("_") )
    {
      continue;
    }

    const newValue = objAfter[key];

    if( deleteValue !== newValue )
    {
      const previousValue = objBefore[ key ];

      if( newValue === previousValue )
      {
        // No change
        continue;
      }

      if( previousValue instanceof Object &&
          newValue instanceof Object )
      {
        // TODO: _recursion

        const diff =
          objectDiff( newValue, previousValue, options, _recursion );

        if( 0 === diff.length )
        {
          // No change
          continue;
        }
      }

      if( undefined !== previousValue )
      {
        if( !ignoreUpdate )
        {
          // update property value
          changes.push( { path: key, set: newValue } );
        }
      }
      else if( !ignoreAdd )
      {
        // add property
        changes.push( { path: key, set: newValue } );
      }
    }
    else if( !ignoreDelete )
    {
      // newValue === deleteValue && ignoreDelete=true
      changes.push( { path: key, unset: 1 } );
    }

  } // end for

  return changes;
}

// ---------------------------------------------------------------------- Method

/**
 * Applies a list of differences to the input object
 * - A list of changes can be generated by e.g. objectDiff
 *
 * @param {object} obj
 * @param {object[]} changes
 *
 * @param {object} options
 * @param {boolean} [options.ignoreAdd=false]
 * @param {boolean} [options.ignoreUpdate=false]
 * @param {boolean} [options.ignoreDelete=false]
 *
 * @param {boolean} [options.ignorePrivate=true]
 *   Ignore properties that start with an underscore e.g. _id or _updatedAt
 */
export function patchObject( obj, changes, options={} )
{
  expectObject( obj, "Missing or invalid parameter [obj]" );
  expectArray( changes, "Missing or invalid parameter [changes]" );

  const ignoreAdd =
    undefined === options.ignoreAdd ? false : options.ignoreAdd;

  const ignoreUpdate =
    undefined === options.ignoreUpdate ? false : options.ignoreUpdate;

  const ignoreDelete =
    undefined === options.ignoreDelete ? false : options.ignoreDelete;

  const ignorePrivate =
    undefined === options.ignorePrivate ? true : options.ignorePrivate;

  for( let j = 0, n = changes.length; j < n; j = j + 1 )
  {
    const change = changes[j];

    const path = change.path;

    // FIXME: recursion

    if( ignorePrivate && path.startsWith("_") )
    {
      continue;
    }

    let newValue;

    if( "unset" in change )
    {
      if( ignoreDelete )
      {
        continue;
      }

      // console.log( "DELETE", change );
      objectSet( obj, path, undefined ); // undefined deletes property
      continue;
    }

    newValue = change.set;

    if( undefined === newValue )
    {
      //logError("Invalid [change]", ignoreDelete, change);
      throw new Error(`Cannot set value [${path}=undefined]`);
    }

    if( ignoreAdd && Object._get( obj, path ) === undefined )
    {
      // Ignore add
      continue;
    }
    else if( ignoreUpdate && objectGet( obj, path ) !== undefined )
    {
      // Ignore update
      continue;
    }

    // Set new value
    objectSet( obj, path, newValue );

  } // end for
}

// ---------------------------------------------------------------------- Method

/**
 * Extend the target object with methods and properties from the source
 * property object
 * - The target object will be extended by inserting the source property
 *   object into it's property chain

 * - If the current target's prototype is not the same as the source
 *   prototype, the source prototype will be cloned
 *
 * @param {object} target - Target object
 * @param {object} source
 *   object to append to the target's prototype chain. The object and it's
 *   prototype objects are cloned first
 */
export function extend( target, source )
{
  expectObjectNoFunction( target, "Invalid parameter [target]" );

  if( Object.isFrozen(target) )
  {
    throw new Error("Invalid parameter [target] (object is immutable)");
  }

  expectObjectNoFunction( source, "Invalid parameter [source]" );

  // let sourceProto = source.prototype;

  let targetProto = Object.getPrototypeOf( target );

  if( targetProto === Object.prototype || Object.isFrozen(targetProto) )
  {
    // FIXME: || Object.isFrozen(targetProto) should not be necessary!

    targetProto = target;
  }

  {
    let obj = source;

    while( obj && obj !== Object.prototype )
    {
      const next = Object.getPrototypeOf( obj );

      copyOwnProperties( obj, targetProto );

      obj = next;
    }
  }

  return;
}

// ---------------------------------------------------------------------- Method

/**
 * Get a list of property names of the specified object
 *
 * @param {object} obj
 *
 * @returns {string[]} List of property names
 */
export function getPrototypeNames( obj )
{
  expectObject( obj, "Missing or invalid parameter [obj]" );

  let proto = obj.prototype || obj;

  const names = [];

  while( proto )
  {
    // console.log( proto );

    names.push( proto.constructor.name );

    proto = Object.getPrototypeOf( proto );
  }

  return names;
}

// ---------------------------------------------------------------------- Method

/**
 * Get a tree of values from an object
 * - Can returns default values if one or multiple values were not found
 *
 * @param {object} obj - Object to get the value from
 * @param {object} tree
 *   Tree that contains the object paths to get.
 *
 *   e.g. { path: 1 }
 *        { some: { path: { to: 1 }, otherPath: { to: 1 } } }
 *        { "some.path.to": 1, "some.otherPath.to": 1 }
 *        { someArray.0.name: 1 }
 *
 * @param {object} [options]
 * @param {object} [options.shallowLeaves=false]
 *   If set to true, the values of the leaves of the tree will be converted
 *   to shallow objects if the leaves are nested objects.
 *
 * @return {object}
 *   nested object with the values that were found or defaultValues
 */
export function getTree( obj, tree, options )
{
  expectObject( obj, "Missing or invalid parameter [obj]");
  expectObject( tree, "Missing or invalid parameter [tree]");

  let shallowLeaves = false;

  if( options instanceof Object && options.shallowLeaves )
  {
    shallowLeaves = true;
  }

  const it = iterateObjectPaths( tree, { walkArrays: true } );

  const result = {};

  for( let arrPath of it )
  {
    // console.log( { arrPath } );

    if( 1 === arrPath.length && arrPath[0].includes( PATH_SEPARATOR ) )
    {
      // Convert "short path syntax" to array path
      arrPath = arrPath[0].split( PATH_SEPARATOR );
    }

    // -- Get value from object at current path

    let leaveValue = Object._get( obj, arrPath );

    // -- Set value in result object at current path

    if( !shallowLeaves || !(leaveValue instanceof Object) )
    {
      // option: shallowLeaves=false OR value is not an object
      // -> no need to convert leaves to shallow objects
      Object._set( result, arrPath, leaveValue );
    }
    else {
      // Set shallow leave value instead of nested object

      const shallowLeaveValue = shallowClone( leaveValue );
      set( result, arrPath, shallowLeaveValue );
    }

  } // end for

  return result;
}

// ---------------------------------------------------------------------- Method

/**
 * Deep copy a value (that is, a recursive copy of all nested properties,
 * also walking the prototype chain)
 * - This method works on objects, but also on any other JS variable type
 * - This method may work recursively
 * - If a value cannot be cloned, a reference is returned. o.a. for
 *   - Error objects
 *   - Browser objects
 *   - Functions
 *
 * @param {mixed} objectToBeCloned - Variable to clone
 *
 * @returns {mixed} cloned output
 */
export function clone( objectToBeCloned, _seenObjects )
{
  // const startTime = Date.now();

  // -- Return references for all variables that are not objects

  if( !(objectToBeCloned instanceof Object) )
  {
    return objectToBeCloned;
  }

  // --- Check if variable has already been cloned before

  if( !_seenObjects )
  {
    _seenObjects = { originals: [], clones: [] };
  }
  else {
    const originals = _seenObjects.originals;

    if( originals.length > 0 )
    {
      const foundIndex = originals.indexOf( objectToBeCloned );

      if( -1 !== foundIndex )
      {
        //console.log("(recursion) return
        //from [_seenObjects]", _seenObjects.clones, foundIndex);
        return _seenObjects.clones[ foundIndex ];
      }
    }
  }

  // -- Handle array (like) objects

  const typeString = object_to_string.call( objectToBeCloned );

  if( Array.isArray(objectToBeCloned) ||
      "[object Arguments]" === typeString )
  {
    const objectClone = [];

    for( let j = 0, n = objectToBeCloned.length; j < n; j = j + 1 )
    {
      objectClone[j] = clone( objectToBeCloned[j], _seenObjects );
    }

    _seenObjects.originals.push( objectToBeCloned );
    _seenObjects.clones.push( objectClone );

    return objectClone;
  }

  // -- Handle not clonable objects

  if( "[object Object]" !==  typeString ||
       objectToBeCloned instanceof Error )
  {
    // Functions, Browser objects, ...
    // - Not clonable -> return reference
    // - No need to add to _seenObjects
    return objectToBeCloned;
  }

  // -- Handle special objects
  {
    // Filter out special objects.
    const Constructor = objectToBeCloned.constructor;

    let objectClone;

    switch( Constructor )
    {
      case RegExp:
        objectClone = new Constructor(objectToBeCloned);
        break;

      case Date:
        objectClone = new Constructor( objectToBeCloned.getTime() );
        break;

      // TODO: other special objects ...
    }

    if( objectClone )
    {
      _seenObjects.originals.push( objectToBeCloned );
      _seenObjects.clones.push( objectClone );

      return objectClone;
    }

    if( objectToBeCloned.hkDoNotClone )
    {
      // Not clonable flag was set -> return reference
      // TODO: Other objects that should not be cloned?
      return objectToBeCloned;
    }
  }

  // -- Create new object and clone properties

  // objectClone = new Constructor();
  // const prototypeClone = Object.create(null);

  const prototypeClone = {};
  const objectClone = Object.create( prototypeClone );

  // Already push object to _seenObjects
  // (objectClone will still change as properties are being cloned)
  _seenObjects.originals.push(objectToBeCloned);
  _seenObjects.clones.push(objectClone);


  for( let prop in objectToBeCloned )
  {
    if( has_own_property.call( objectToBeCloned,  prop ) )
    {
      // Own property -> clone into object
      objectClone[prop] = clone( objectToBeCloned[prop], _seenObjects );
    }
    else {
      // Inherited property -> clone into prototype

      // @warning
      //   known issue: all inherited properties are copied into the
      //   same prototype object!

      prototypeClone[prop] = clone( objectToBeCloned[prop], _seenObjects );
    }
  }

  return objectClone;
}


// ---------------------------------------------------------------------- Method

/**
 * Set a read only property in an object
 *
 * @param {object} obj - Object to set the read only property in
 * @param {string} propertyName - Name of the property to set
 * @param {mixed} value - Value to set
 */
export function setReadOnlyProperty( obj, propertyName, value )
{
  expectObject( obj,
    "Missing or invalid parameter [obj]" );

  expectString( propertyName,
    "Missing or invalid parameter [propertyName]");

  expectDefined( value,
    "Missing or invalid parameter [value]" );

  Object.defineProperty(
    obj,
    propertyName,
    {
      value,
      writable: false,
      enumerable: true
    } );
}

// ---------------------------------------------------------------------- Method

/**
 * Returns a clone of a (nested) object that has a maximum depth
 *
 * @param {object|array} obj
 *
 * @returns {object|array} shallow object or array
 */
export function shallowClone( objectOrArray )
{
  expectObject( objectOrArray,
    "Missing or invalid parameter [objectOrArray]" );

  if( Array.isArray( objectOrArray ) )
  {
    // obj is an array

    let isShallow = true;

    for( let j = 0, n = objectOrArray.length; j < n; j = j + 1 )
    {
      const value = objectOrArray[ j ];

      if( value instanceof Object )
      {
        isShallow = false;
        break;
      }
    } // end for

    if( isShallow )
    {
      // objectOrArray is already shallow -> nothing to do
      return objectOrArray;
    }

    const outputArray = [];

    for( let j = 0, n = objectOrArray.length; j < n; j = j + 1 )
    {
      const value = objectOrArray[ j ];

      if( !(value instanceof Object) )
      {
        outputArray.push( value );
      }
      // else {
      //   //outputArray.push( null );
      //   // outputArray.push( $removed );
      // }

    } // end for

    return outputArray;
  }
  else {
    // obj is a not an array

    let isShallow = true;

    for( const key in objectOrArray )
    {
      const value = objectOrArray[ key ];

      if( value instanceof Object )
      {
        isShallow = false;
        break;
      }
      // else {
      //   // outputObj[ key ] = null;
      //   // outputObj[ key ] = $removed;
      // }

    } // end for

    if( isShallow )
    {
      // objectOrArray is already shallow -> nothing to do
      return objectOrArray;
    }

    const outputObj = {};

    for( const key in objectOrArray )
    {
      const value = objectOrArray[ key ];

      if( !(value instanceof Object) )
      {
        outputObj[ key ] = value;
      }
      // else {
      //   // outputObj[ key ] = null;
      //   // outputObj[ key ] = $removed;
      // }

    } // end for

    return outputObj;
  }
}

// ---------------------------------------------------------------------- Method

/**
 * Update an object
 * - Sets the path-value pairs from the updateData in the object
 * - Existing values will be overwritten
 * - Existing intermediate values (objects, arrays) will be overwritten too
 *   (if updateData is an object, not an iterable)
 *
 * @param {object} [obj] - Input object
 *
 * @param {object|iterable} updateData - Data to update
 *
 * Note that if using path-value pairs, the order of the pairs is relevant:
 *   {
 *     "some": {},
 *     "some.path": {},
 *     "some.path.to": 2,
 *   }
 *
 * @returns {object} updated object
 */
export function updateObject( obj=null, updateData=null, options )
{
  // -- Check parameter [obj]

  expectObject( obj, "Missing or invalid parameter [obj]");

  expectObject( updateData, "Missing or invalid parameter [updateData]");

  // -- Update cloned object

  let pathValuePairs;

  if( !isIterable( updateData ) )
  {
    // Convert updateData to path-value pairs (iterable)

    const walkArrays = options && options.replaceArrays ? true : false

    pathValuePairs =
      iterateObjectEntries(
        updateData,
        {
          expandPathKeys: true,
          outputIntermediateNodes: true,
          walkArrays
        } );

    // pathValuePairs = Array.from( pathValuePairs );
    // console.log( "CHECK", { updateData, pathValuePairs } );
  }
  else {
    // Iterable -> assume iterable of path-value pairs
    pathValuePairs = updateData;
  }

  for( const [ arrPath, value ] of pathValuePairs )
  {
    // console.log( "updateObject:set", arrPath, value );
    objectSet( obj, arrPath, value );
  }

  return obj;
}

// ---------------------------------------------------------------------- Method

/**
 * Copy own properties from an object to another object if they do not
 * exist yet.
 *
 * @param {object} from - Object ot copy properties from
 * @param {object} to - Object to copy properties to
 */
export function copyOwnProperties( from, to )
{
  const propertyNames =
      Object.getOwnPropertyNames( from ) ;

  const nProperties = propertyNames.length;

  if( !nProperties )
  {
    return;
  }

  const firstIsConstructor =
    ("constructor" === propertyNames[0]) ? true : false;

  if( 1 === nProperties && firstIsConstructor )
  {
    return;
  }

  let startAt = firstIsConstructor ? 1 : 0;

  // console.log("propertyNames", from, propertyNames, startAt);

  for( let j = startAt; j < nProperties; j = j + 1 )
  {
    const key = propertyNames[ j ];

    const descriptor =
      Object.getOwnPropertyDescriptor( from, key );

    const targetDescriptor =
      Object.getOwnPropertyDescriptor( to, key );

    // Not needed, we copy an instance
    // descriptor.value = clone( descriptor.value );

    if( !targetDescriptor )
    {
      // Property does not yet exist
      Object.defineProperty( to, key, descriptor );
    }
  } // end for

  // >>> FIXME? TODO? copy Symbols too? <<<
}

// ---------------------------------------------------------------------- Method

/**
 * Convert string with dot separated values to a list of values
 * - Accepts that the supplied path is already an array path
 *
 * @param {string|string[]} path
 *
 * @returns {string[]} list of path values
 */
export function ensureArrayPath( path )
{
  if( typeof path === "string" )
  {
    return path.split( PATH_SEPARATOR );
  }
  else if( Array.isArray( path ) )
  {
    // Nothing to do
    return path;
  }
  else {
    throw new Error(
      "Missing or invalid parameter [path] (expected string or array)");
  }
}

/* ----------------------------------------------------- Internal methods */

// ---------------------------------------------------------------------- Method

/**
 * Create all parent objects on the object path if they do not yet exist yet
 * - This method will throw an exception if there is a non-object node in
 *   the path
 *
 * @param {object} obj
 *   Object to create the parent objects in
 *
 * @param {string[]} arrPath
 *   The path that specified which parent oobjects to create
 *
 * @returns {object} the input object with the created object properties
 */
export function _ensureParent( obj, arrPath )
{
  // console.log("_ensureParent (1)", { obj, arrPath } );

  let current = obj;
  let prev = current;

  for( let j = 0, n_1 = arrPath.length - 1; j < n_1; j = j + 1 )
  {
    let key = arrPath[ j ];

    current = current[ key ];

    if( current === undefined || current === null )
    {
      current = prev[ key ] = {};
      prev = current;
      continue;
    }

    const nextKey = arrPath[ j + 1 ];

    // Check
    // Check if current is an object
    // If current is an array, check if the nextKey can be set on a array

    if( current instanceof Object )
    {
      if( Array.isArray(current) && j < n_1 )
      {
        const nextKeyAsInt = parseInt( nextKey, 10 );

        if( Number.isNaN(nextKeyAsInt) )
        {
          // console.log("CHECK", { obj, arrPath, j, current, nextKey } );
          throw new Error(
            `Cannot set property [${nextKey}] ` +
            "on data node of type [Array]");
        }
      }
    }
    else {
      // console.log( { current, prev, key, arrPath, j } );

      throw new Error(
        `Cannot set property [${nextKey}] from ` +
        `path [${display_array_path(arrPath)}] on data node that is not ` +
        "an object or an array");
    }

    prev = current;

  } // end for

  return current;
}

// ---------------------------------------------------------------------- Method

/**
 * Get parent object at the specified path
 *
 * @param {object}   obj - Object to work in
 * @param {string[]} arrPath - Path to get the parent object for
 *
 * @returns {object|array|null} parent object or null if not found
 */
export function _getParent( obj, arrPath )
{
  let current = obj;

  for( let j = 0, n_1 = arrPath.length - 1; j < n_1; j = j + 1 )
  {
    let key = arrPath[j];

    current = current[key];

    if( typeof current === "undefined" )
    {
      return null;
    }

    if( current instanceof Object )
    {
      if( Array.isArray(current) && j < n_1 - 1 )
      {
        // node is an array
        // -> use next part of the array path as (numerical) array index

        key = arrPath[ j + 1 ];
        const keyAsInt = parseInt( key, 10 );

        if( Number.isNaN(keyAsInt) )
        {
          throw new Error(
            `Cannot get property [${display_array_path(arrPath, j)}]` +
            "from data node of type [Array]");
        }
      }
    }
    else {
      throw new Error(
        `Cannot get property [${display_array_path(arrPath, j)}]` +
        "from a data node that is not an object or an array");
    }

  } // end for

  return current;
}
