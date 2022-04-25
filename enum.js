
import { expectSymbol } from "./expect.js";

export { default as SERVICE_STATES } from "./enum/service_states";
export { default as LOG_TYPES } from "./enum/log_types";

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
