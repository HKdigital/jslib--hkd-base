
import { toArrayPath,
         PATH_SEPARATOR } from "@rootDir/helpers/array.js";

/* -------------------------------------------------------------------- Tests */

describe('toArrayPath( <none> )', () =>
{
  test('should throw an exception', () => {

    expect( toArrayPath ).toThrow();
    expect( toArrayPath.bind( null, undefined ) ).toThrow();

  } );
} );

// -----------------------------------------------------------------------------

describe('toArrayPath( <string> )', () =>
{
  test('should convert [path] to array', () => {

    expect( typeof PATH_SEPARATOR ).toBe("string");

    expect( toArrayPath( "one" ) ).toEqual( [ "one" ] );

    {
      const path = `one${PATH_SEPARATOR}two${PATH_SEPARATOR}three`;
      expect( toArrayPath( path ) ).toEqual( [ "one", "two", "three" ] );
    }

  } );

  test('should work with custom path separator [/]', () => {

    const pathSeparator = "/";

    expect( toArrayPath( "one/two/three", pathSeparator ) )
      .toEqual( [ "one", "two", "three" ] );

  } );
} );

// -----------------------------------------------------------------------------

describe('toArrayPath( <array> )', () =>
{
  test('should return a reference to the original array', () => {

    const arrPath = ["one", "two", "three" ];

    expect( toArrayPath( arrPath ) ).toBe( arrPath );

  } );
} );