/**
 * crc32.js
 *
 * @description
 * This file contains a function that can be used to calculate a CRC32 value of
 * a string.
 *
 * A CRC value is a hash that can be calculated very quickly and is
 * often used for data integrity checks.
 *
 * CRC32 is not a cryptographic safe hash
 *
 * @see http://stackoverflow.com/questions/18638900/javascript-crc32
 */

/* ---------------------------------------------------------------- Internals */

const CRC32 = "crc32";
const CRC32C = "crc32c";

const START_POLYNOMIALS =
  {
    [ CRC32 ]: 0xEDB88320,
    [ CRC32C ]: 0x82f63b78
  };

const crcTables = {};

/**
 * Create a CRC data table that can be used by CRC calculation functions
 * - Creates lookup table for the specified CRC32 variant
 *
 * @param {string} [variant=CRC32]
 */
function makeCRCTable( variant=CRC32 )
{
  let c;
  const crcTable = [];

  const START_POLYNOMIAL = START_POLYNOMIALS[ variant ];

  if( !START_POLYNOMIAL )
  {
    throw new Error(`Invalid variant [${variant}]`);
  }

  for( let n = 0; n < 256; n = n + 1 )
  {
    c = n;

    for( let k = 0; k < 8; k = k + 1 )
    {
      c = ( (c&1) ? (START_POLYNOMIAL ^ (c >>> 1)) : (c >>> 1) );
    }
    crcTable[n] = c;
  } // end for

  return crcTable;
}

/* ------------------------------------------------------------------ Exports */

export { CRC32, CRC32C };

// -----------------------------------------------------------------------------

/**
 * Calculate a hash value for the supplied input string
 *
 * @param {string} str - String to calculate the checksum for
 * @param {string} [variant=CRC32]
 *
 * @return {number} numeric CRC32C value (integer)
 */
export function stringToCrc32( str, variant=CRC32 )
{
  const table = crcTables[ variant ] ||
                (crcTables[ variant ] = makeCRCTable( variant ));

  let crc = 0 ^ (-1);

  for( let j = 0; j < str.length; j = j + 1 )
  {
    crc = (crc >>> 8) ^ table[ (crc ^ str.charCodeAt(j)) & 0xFF ];
  }

  return (crc ^ (-1)) >>> 0;
}
