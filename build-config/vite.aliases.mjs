
/**
 * Function that generates aliases for a `vitejs` config
 *
 * @param {function} options.resolveCurrentLibPath
 *   Function to create paths relative to the lib root
 *
 * @returns {array} list of vitejs config aliases used by the lib
 */
export function generateAliases( { resolveCurrentLibPath } )
{
  return [
    { find: "$hkd-base",
      replacement: resolveCurrentLibPath() }
  ];
}