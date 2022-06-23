
/* ------------------------------------------------------------------ Imports */

import { expectString,
         expectObject } from "./expect.js";

import ValueStoreMap from "../classes/ValueStoreMap.js";

/* ---------------------------------------------------------------- Internals */

const configMap = new ValueStoreMap();

/* ------------------------------------------------------------------ Exports */

/**
 * Set a global configuration
 *
 * @param {string} label - Label of the config
 * @param {object} config - Configuration data
 */
export function setGlobalConfig( label, config )
{
  expectString( label, "Missing or invalid parameter [label]");
  expectObject( config, "Missing or invalid parameter [config]");

  // console.log(`Set config [${label}]`);

  configMap.set( label, config );
}

// -----------------------------------------------------------------------------

/**
 * Get a global config
 *
 * @param {string} label - Label of the config
 * @param {object} [defaultValue=undefined]
 *
 * @returns {ValueStore} Config store
 */
export function getGlobalConfig( label, defaultValue )
{
  expectString( label, "Missing or invalid parameter [label]");

  const config = configMap.get( label );

  // console.log( "Get config", label );

  if( !config )
  {
    if( undefined === defaultValue )
    {
      throw new Error(
        `Config [${label}] not found and no default value was set` );
    }

    return defaultValue || null;
  }

  return config;
}

/* --------------------------------------------- Hot Module Replacement (dev) */

if( import.meta.hot )
{
  import.meta.hot.accept( () => {
    import.meta.hot.invalidate(); // Force page reload
  } );
}