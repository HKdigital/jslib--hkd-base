
import { expectSymbol } from "$hk/expect.js";

export { default as SERVICE_STATES } from "$hk/enum/service_states";
export { default as LOG_TYPES } from "$hk/enum/log_types";

/**
 * Convert an enum value to a string
 * - Returns the Symbol's description text
 *
 * @param {Symbol} enum_value
 *
 * @returns {string} the description text of the enum value (a Symbol)
 */
export function describe( enumValue )
{
  expectSymbol( enumValue, "Missing or invalid parameter [enumValue]" );

  return enumValue.description;
}
