
/* ------------------------------------------------------------------ Imports */

import { expectNotEmptyString,
         expectObject } from "@hkd-base/helpers/expect.js";

import { currentLanguage,
         LANG_DEFAULT } from "@hkd-base/stores/language.js";

import { systemLog } from "@hkd-base/helpers/log.js";

/* ---------------------------------------------------------------- Internals */

const translations_ = {};

/* ------------------------------------------------------------------ Exports */

/**
 * Set multiple text translations at once
 *
 * @param {object} translations
 *   Object that contains `text label` => `translation` pairs
 */
export function setTranslations( translations )
{
  expectObject( translations,
    "Missing or invalid parameter [translations]" );

  for( const textLabel in translations )
  {
    setTranslation( textLabel, translations[ textLabel ] );
  }
}

// -------------------------------------------------------------------- Function

/**
 * Set a translation for a text label
 * 
 * @param {string} label
 * @param {string|object} translation
 *   Item can be a string, in that case, it is used as default for all languages
 *   Item can be an object with language label properties. In that case, every 
 *   specified language can have a separate translation
 *
 *   e.g. setTranslation( "MAIN_MENU", "main menu" )
 *   
 *   e.g. setTranslation( "MAIN_MENU", 
 *          {
 *            "en": "main menu",
 *            "nl": "hoofdmenu",
 *            "es": "menu principal"
 *          } )
 */
export function setTranslation( label, translation )
{
  expectNotEmptyString( label, "Missing or invalid parameter [label]" );

  if( (typeof item === "string" && translation.length > 0) ||
      (translation instanceof Object) )
  {
    translations_[ label ] = translation;
  }
}

// -------------------------------------------------------------------- Function

/**
 * Get the text for the specified label and language
 * - If a single translation was set for the specified labelm that value will
 *   be used
 * - If no language has been specified, `currentLanguage` from
 *   `@hkd-base/language.js` will be used
 * - If no value was found for the custom or the `currentLanguage`, the
 *   option for the default language will be returned (LANG_DEFAULT)
 * 
 * @param {string} label - Label of the text to return
 * @param {string} [lang=<currentLanguage>]
 * 
 * @returns {string} text for the specified label and language
 */
export function text( label, lang )
{
  if( lang )
  {
    expectNotEmptyString( lang, "Invalid parameter [lang]" );
  }
  else {
    lang = currentLanguage.get();
  }

  const item = translations_[ label ];

  let text;

  if( typeof item === "string" )
  {
    text = item; // just a string -> use for all languages
  }
  else if( item instanceof Object )
  {
    text = item[ lang ];

    if( undefined === text )
    {
      text = item[ LANG_DEFAULT ];

      if( undefined === text )
      {
        console.warn(`Using label instead of text [label=${label}]`);
        return label;
      }
      else {
        console.warn(`Using default language for text [label=${label}]`);
      }
    }
  }
  else {
    systemLog.warning( `No text found for [label=${label}]` );
  }

  return text;
}