
import { sortByPathValue,
         PATH_SEPARATOR } from "$rootDir/array.js";

/* -------------------------------------------------------------------- Tests */

describe('sortByPathValue( <none> ), sortByPathValue( <items>, <none> )', () =>
{
  test('should throw an exception', () => {

    expect( sortByPathValue ).toThrow();
    expect( sortByPathValue.bind( null, [] ) ).toThrow();
  } );
} );

// -----------------------------------------------------------------------------

describe('sortByPathValue( <items>, <path> )', () =>
{
  test('should sort the array', () => {

    const items =
      [
        { value: 2, nested: { value: "c" } },
        { value: 1, nested: { value: "b" } },
        { value: 3, nested: { value: "a" } }
      ];

    sortByPathValue( items, "value" ) ;

    expect( items[0].value ).toEqual( 1 );
    expect( items[1].value ).toEqual( 2 );
    expect( items[2].value ).toEqual( 3 );

    sortByPathValue( items, `nested${PATH_SEPARATOR}value` );

    expect( items[0].value ).toEqual( 3 );
    expect( items[1].value ).toEqual( 1 );
    expect( items[2].value ).toEqual( 2 );
  } );
} );
