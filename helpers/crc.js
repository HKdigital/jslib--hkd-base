/**
 * crc.js
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

let crcTable;

/**
 * Create a CRC data table that can be used by CRC calculation functions
 */
function makeCRCTable()
{
  let c;
  const crcTable = [];

  for( let n = 0; n < 256; n = n + 1 )
  {
    c = n;

    for( let k = 0; k < 8; k = k + 1 )
    {
      c = ( (c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1) );
    }
    crcTable[n] = c;
  } // end for

  return crcTable;
}

/* ------------------------------------------------------------------ Exports */

/**
 * Calculate a hash value for the supplied input string
 *
 * @param {string} str - String to calculate the checksum for
 *
 * @return {number} numeric CRC32 value (integer)
 */
export function stringToCrc32( str )
{
  const _crcTable = crcTable || (crcTable = makeCRCTable());

  let crc = 0 ^ (-1);

  for( let j = 0; j < str.length; j = j + 1 )
  {
    crc = (crc >>> 8) ^ _crcTable[ (crc ^ str.charCodeAt(j)) & 0xFF ];
  }

  return (crc ^ (-1)) >>> 0;
}
