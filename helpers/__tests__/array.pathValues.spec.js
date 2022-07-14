
import { pathValues,
         PATH_SEPARATOR } from "@rootDir/helpers/array.js";

/* -------------------------------------------------------------------- Tests */

describe('pathValues( <none> ), pathValues( <Array>, <none> )', () =>
{
  test('should throw an exception', () => {

    expect( pathValues ).toThrow();
    expect( pathValues.bind( null, [] ) ).toThrow();

  } );
} );

// -----------------------------------------------------------------------------

describe('pathValues( <items[]>, <path> )', () =>
{
  test('should return path values from the items', () => {

    expect( typeof PATH_SEPARATOR ).toBe("string");

    const items =
      [
        { value: 1, nested: { value: 4 } },
        { value: 2, nested: { value: 5 } },
        { value: 3, nested: { value: 6 } }
      ];

    expect( pathValues( items, "value" ) ).toEqual( [ 1, 2, 3 ] );

    expect( pathValues( items, `nested${PATH_SEPARATOR}value` ) )
      .toEqual( [ 4, 5, 6 ] );
  } );
} );

