
import { base58fromNumber,
         base58toNumber,
         base58toBytes,
         bytesToNumber } from "@rootDir/helpers/base-58.js";

//
// TODO: TEST: ALPHABET_BASE_58 and isBase58
//

/* -------------------------------------------------------------------- Tests */

describe('base58toNumber( <number> )', () =>
{
  test('should convert a number to a base 58 string', () => {

    expect( base58toNumber( "1" ).toString() ).toBe( "0" );
    expect( base58toNumber( "z" ).toString() ).toBe( "57" );
    expect( base58toNumber( "21" ).toString() ).toBe( "58" );
    expect( base58toNumber( "32" ).toString() ).toBe( "117" );

  } );
} );

// -----------------------------------------------------------------------------

describe('base58fromNumber( <number> )', () =>
{
  test('should convert a number to a string', () => {

    expect( base58fromNumber( 0 ) ).toBe( "1" );
    expect( base58fromNumber( 57 ) ).toBe( "z" );
    expect( base58fromNumber( 58 ) ).toBe( "21" );
    expect( base58fromNumber( 117 ) ).toBe( "32" );

    expect( base58fromNumber( BigInt(117) ) ).toBe( "32" );

    // TODO: test with really big BigInt value

  } );
} );

// -----------------------------------------------------------------------------

describe('base58toBytes( <str> )', () =>
{
  test('should convert a base 58 encoded string to bytes', () => {

    const inputValue = BigInt(Number.MAX_SAFE_INTEGER);

    const value58 = base58fromNumber( inputValue );

    let valueBytes = base58toBytes( value58 );

    const outputValue = bytesToNumber( valueBytes );

    // console.log(
    //   {
    //     inputValue,
    //     outputValue
    //   } );

    expect( inputValue ).toBe( outputValue );

  } );
} );
