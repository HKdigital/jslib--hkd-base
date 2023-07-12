
//
// EXT_LATIN_TOKENS_LC
// - Extended list of latin tokens, works for most latin languages
//
// @note
//   Both upper- and lower case extended latin tokens are:
//   "ŠŒŽšœžŸñÑÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðòóôõöøùúûüýþÿ"
//
// TODO:
//   Replace with unicode property escapes when supported ES2018
//   (not yet supported by MS Edge 12)
//   https://github.com/tc39/proposal-regexp-unicode-property-escapes
//   http://unicode.org/Public/UNIDATA/PropertyValueAliases.txt
//   https://www.fileformat.info/info/unicode/category/index.htm
//   https://github.com/danielberndt/babel-plugin-utf-8-regex/
//     blob/master/src/transformer.js
//
export const EXT_LATIN_TOKENS_LC = "šœžÿñàáâãäåæçèéêëìíîïðòóôõöøùúûüýþß";

// RegExp and RegExp part constants

// TODO:
//   regexAstralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
//   "-~.,`'\"‘’“”„±€$@%&¡¿©®"
//   REP_PUNCTUATION = ",.¡!¿?;:-";

export const C =
  {
    EXT_LATIN_TOKENS_LC,
    REP_NUMBER: "0-9",
    REP_LETTER_LC: `a-z${EXT_LATIN_TOKENS_LC}`,
    REP_LETTER_NUMBER_LC: `0-9a-z${EXT_LATIN_TOKENS_LC}`
  };

export const RE_EMAIL =
  new RegExp(
      '^(([^<>()[\\]\\.,;:\\s@"]+(.[^<>()[\\]\\.,;:\\s@"]+)*)|(".+"))@((([' +
      '\\-' + C.REP_LETTER_NUMBER_LC +
      ']+\\.)+[' + C.REP_LETTER_LC + ']{2,}))$', 'i' );

// export const RE_URL = << TODO

export const RE_PHONE =
  /(^\+[0-9]{2}|^\+[0-9]{2}\(0\)|^\(\+[0-9]{2}\)\(0\)|^00[0-9]{2}|^0)([0-9]{9}$|[0-9\-\s]{10}$)/;

export const RE_POSTCODE_DUTCH =
   /^[1-9]{1}[0-9]{3} ?[A-Za-z]{2}$/;

export const RE_PLACE_DUTCH =
   new RegExp( "^['`]{0,1}" +
               `[${C.REP_LETTER_LC}]{0,}` +
               `[-\\s]{0,1}` +
               `[${C.REP_LETTER_LC}]{2,}$`,
               "i" );

// export const RE_NAME =
//   new RegExp( `^[${C.REP_LETTER_LC}\\s-\`']{2,}$`, "i" );

export const RE_NAME =
  new RegExp( `^[${C.REP_LETTER_LC}]{1}` +
               `[${C.REP_LETTER_LC}\\s-\`'\\.]{0,}$`, "i" );

export const RE_FANTASY_NAME =
  new RegExp("^[" + C.REP_LETTER_NUMBER_LC +
             "\\x20!@#\\$%\\^&\\*\\(\\)-_+=\\|:;'\"'`~<,>.?/\\\\]{2,}$", "i" );

export const RE_ADDRESS =
  new RegExp( "^[" + C.REP_LETTER_NUMBER_LC + ".,°\\s-]{2,}$", "i" );

export const RE_HAS_A_LETTER_OR_NUMBER = new RegExp( "[a-z0-9]+", "i" );

export const RE_MULTIPLE_SPACES = new RegExp("[\\s]{2,}", "g");
// export const RE_MULTIPLE_SPACES = /  +/g

export const RE_LABEL = new RegExp('^[a-z0-9_-]{2,}$');

export const RE_COLLECTION_NAME =
  new RegExp( "^[a-z0-9\\s-_]{1,}$", "i" );

export const RE_URI_COMPONENT =
  new RegExp( "^[" + C.REP_LETTER_LC + "\\s-_]{1,}$", "i" );

//
// @see https://usefulshortcuts.com/alt-codes/accents-alt-codes.php
//