
export async function getAliases(
  {
    resolveCurrentLibPath
  } )
{
  return {
    "$hk": resolveCurrentLibPath()
  };
}