
/**
 * store.js
 *
 * @description
 * This file exports helper functions that work with `store` instances
 */

/* ------------------------------------------------------------------ Imports */

import { expectDefined,
         expectPositiveNumber,
         expectObjectPath,
         expectStore }
  from '@hkd-base/helpers/expect.js';

import { defer }
  from '@hkd-base/helpers/process.js';

import { objectGet }
  from '@hkd-base/helpers/object.js';

import HkPromise
  from '@hkd-base/classes/HkPromise.js';

import '@hkd-base/typedef/Store.type.js';

/* ---------------------------------------------------------------- Internals */

const TRUTHY = Symbol('truthy');

/* ------------------------------------------------------------------ Exports */

/**
 * Wait until the store contains the specified value
 *
 * @example
 *   await waitForStoreValue(
 *     {
 *       store: blueBackGroundState,
 *       value: READY,
 *       path: ["current", "label"],
 *       timeout: 2000
 *     } );
 *
 * @param {object} _

 * @param {Store} _.store
 * @param {*} _.value
 *
 * @param {string|string[]} [_.path]
 *   If specified the value will be compared with a store value at the
 *   specified object path.
 *
 * @param {number} [_.timeout]
 *
 * @returns {Promise<true>}
 */
export async function waitForStoreValue(
  { store, value, path, timeout }={} )
{
  expectStore( store );
  expectDefined( value );

  if( path )
  {
    expectObjectPath( path );
  }

  if( !timeout || timeout === -1 )
  {
    timeout = 0;
  }

  const promise = new HkPromise();

  const unsubscribeFn = store.subscribe( ( _value ) =>
    {
      if( promise.resolved )
      {
        unsubscribeFn && unsubscribeFn();
        return;
      }

      if( path && _value && typeof _value === 'object' )
      {
        // Use object path to get store value
        _value = objectGet( _value, path );
      }

      // console.log( { value, _value } );

      if( value === TRUTHY && _value )
      {
        unsubscribeFn && defer( unsubscribeFn );
        promise.resolve( value );
      }
      else if( _value === value )
      {
        unsubscribeFn && defer( unsubscribeFn );
        promise.resolve( value );
      }
    } );

  if( timeout > 0 )
  {
    expectPositiveNumber( timeout );

    promise.catch( unsubscribeFn );

    promise.setTimeout( timeout );
  }

  return promise;
}

// -----------------------------------------------------------------------------

/**
 * Wait until the store contains a truthy value
 *
 * @example
 *   await waitForStoreValue(
 *     {
 *       store: urlStore,
 *       timeout: 2000
 *     } );
 *
 * @param {object} _

 * @param {Store} _.store
 * @param {*} _.value
 *
 * @param {string|string[]} [_.path]
 *   If specified the value will be compared with a store value at the
 *   specified object path.
 *
 * @param {number} [_.timeout]
 *
 * @returns {Promise<true>}
 */
export async function waitForAnyStoreValue(
  { store, path, timeout }={} )
{
  expectStore( store );

  const value = TRUTHY;

  return waitForStoreValue( { store, value, path, timeout } );
}

