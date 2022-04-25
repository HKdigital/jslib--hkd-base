/**
 * stores.js
 *
 * @description
 * This file contains code for reactive programming based on the SVELTE stores
 * concept. The code in this file extends the functionality of SVELTE stores
 * and makes it available for plain Javascript projects without SVELTE.
 *
 * @example
 *
 *   <TODO>
 */

export { default as ValueStore } from "./classes/ValueStore.js";
export { default as DedupValueStore } from "./classes/DedupValueStore.js";
export { default as DerivedStore } from "./classes/DerivedStore.js";
export { default as ValueStoreMap } from "./classes/ValueStoreMap.js";
