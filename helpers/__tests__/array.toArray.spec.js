
import { toArray }
  from '@hkd-base/helpers/array.js';

/* -------------------------------------------------------------------- Tests */

describe('toArray( <none|undefined|null> )', () =>
{
  test('should return an empty array', () => {

    expect( toArray() ).toEqual( [] );
    expect( toArray( undefined ) ).toEqual( [] );
    expect( toArray( null ) ).toEqual( [] );

  } );
} );

// -----------------------------------------------------------------------------

describe('toArray( <array>)', () =>
{
  test('should return the original array reference', () => {

    const input = [];
    const output = toArray( input );

    expect( output ).toBe( input );
  } );
} );

// -----------------------------------------------------------------------------

describe('toArray( <primitive> )', () =>
{
  test('should return an array containing the supplied value', () => {

    expect( toArray( 1 ) ).toEqual( [ 1 ] );
  } );
} );

// -----------------------------------------------------------------------------

describe('toArray( <Arguments> )', () =>
{
  test('should convert the Arguments object to an Array', () => {

    function fn()
    {
      return toArray( arguments );
    }
    expect( fn( 1 ) ).toEqual( [ 1 ] );
  } );
} );

// -----------------------------------------------------------------------------

describe('toArray( <iterator> )', () =>
{
  test('should return an array of iterated value(s)', () => {

    function* makeIterator() {
      yield 1;
      yield 2;
      yield 3;
    }

    const it = makeIterator();

    expect( toArray( it ) ).toEqual( [ 1, 2, 3 ] );
  } );
} );

// -----------------------------------------------------------------------------

describe('toArray( <array|Arguments>, start, end )', () =>
{
  test('should return a sliced array', () => {

    const input = [ 1, 2, 3, 4, 5 ];
    const output = toArray( input, 2, 4 );

    expect( output ).toEqual( [ 3, 4 ] );
  } );


} );
