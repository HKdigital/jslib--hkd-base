
import { loop } from "$rootDir/array.js";

/* -------------------------------------------------------------------- Tests */

describe('loop( <Array>, <none> )', () =>
{
  test('should throw an exception', () => {

    expect( loop ).toThrow();
    expect( loop.bind( null, [] ) ).toThrow();

  } );
} );

// -----------------------------------------------------------------------------

describe('loop( <none>, <callback> )', () =>
{
  test('should do nothing', () => {

    const fn = jest.fn();

    loop( undefined, fn );
    loop( null, fn );

    expect( fn ).not.toHaveBeenCalled();
  } );
} );

// -----------------------------------------------------------------------------

describe('loop( <Array>, <callback> )', () =>
{
  test('should call <callback> for each Array value', () => {

    const arr = [ "a", "b", "c" ];

    const callback = jest.fn();

    loop( arr, callback );

    expect( callback ).toHaveBeenNthCalledWith( 1, "a" );
    expect( callback ).toHaveBeenNthCalledWith( 2, "b" );
    expect( callback ).toHaveBeenNthCalledWith( 3, "c" );

  } );
} );

// -----------------------------------------------------------------------------

describe('loop( <Array>, <callback>, <additionalArguments> )', () =>
{
  test('should pass addition arguments to callback', () => {

    const arr = [ "a", "b", "c" ];

    const callback = jest.fn();

    loop( arr, callback, [ "abc", "xyz" ] );

    expect( callback ).toHaveBeenNthCalledWith( 1, "a", "abc", "xyz" );
    expect( callback ).toHaveBeenNthCalledWith( 2, "b", "abc", "xyz" );
    expect( callback ).toHaveBeenNthCalledWith( 3, "c", "abc", "xyz" );

  } );
} );

