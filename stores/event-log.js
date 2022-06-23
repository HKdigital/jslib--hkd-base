
import { generateLocalId } from "@hkd-base/helpers/unique.js";

import ValueStore from "@hkd-base/classes/ValueStore.js";

/* ------------------------------------------------------------------ Exports */

export let caseId = new ValueStore( generateLocalId() );

// -----------------------------------------------------------------------------

/**
 * Set a new value in the caseId store
 *
 * @param {string} [customCaseId]
 *   If not set a (locally) unique caseId will be generated
 *
 * @returns {string} caseId
 */
export function setNewCaseId( customCaseId )
{
  caseId.set( customCaseId || generateLocalId() );

  return caseId.get();
}