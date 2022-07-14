
import { toArrayAsync } from "@rootDir/helpers/array.js";

/* -------------------------------------------------------------------- Tests */

describe('toArrayAsync( <none> )', () =>
{
  test('should return an empty array exception', async () => {

    expect( await toArrayAsync() ).toEqual( [] );
    expect( await toArrayAsync( undefined ) ).toEqual( [] );
    expect( await toArrayAsync( null ) ).toEqual( [] );

  } );
} );

// -----------------------------------------------------------------------------

describe('toArrayAsync( <asyncIterator> )', () =>
{
  test('should return an array with iterated values', async () => {

    const myAsyncIterable = {
      async* [Symbol.asyncIterator]() {
        yield 1;
        yield 2;
        yield 3;
      }
    };

    expect( await toArrayAsync( myAsyncIterable ) ).toEqual( [ 1, 2, 3 ] );

  } );
} );