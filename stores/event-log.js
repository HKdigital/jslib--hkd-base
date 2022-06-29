
import { generateLocalId } from "@hkd-base/helpers/unique.js";

import ValueStore from "@hkd-base/classes/ValueStore.js";

/* ------------------------------------------------------------------ Exports */

export let caseId = new ValueStore( generateLocalId() );

// -----------------------------------------------------------------------------

/**
 * Start a new case
 * - Sets a new value in the caseId store
 * - The caseId value can be used in event-logs
 *
 * More information about event logs
 * @see https://www.bupar.net/creating_eventlogs.html
 *
 * --
 *
 * @param {string} [customCaseId]
 *   If not set a (locally) unique caseId will be generated
 *
 * @returns {string} caseId
 */
export function startNewCase( customCaseId )
{
  caseId.set( customCaseId || generateLocalId() );

  return caseId.get();
}