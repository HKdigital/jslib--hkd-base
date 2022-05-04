
/* ------------------------------------------------------------------ Imports */

import { expectNotEmptyString } from "@hkd-base/expect.js";
import { ValueStore } from "@hkd-base/stores.js";

/* ------------------------------------------------------------------ Exports */

export const LANG_DEFAULT = "en";

export const currentLanguage = new ValueStore( LANG_DEFAULT );

/**
 * Set the current language
 * - Suggestion: use ISO 639-1 language codes like 'en' or 'es'
 *
 * @param {string} languageCode
 */
export function setLanguage( languageCode )
{
  expectNotEmptyString( languageCode,
    "Missing or invalid parameter [languageCode]" );

  currentLanguage.set( languageCode );
}
