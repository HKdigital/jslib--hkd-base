
/**
 * Returns true if the value is truthy
 *
 * @param {*} value
 *
 * @returns {boolean} true if the value is truthy
 */
export function isTruthy( value, emptyIsTrue=true )
{
  switch( typeof value )
  {
    case "string":
      switch( value )
      {
        case "1", "true":
          return true;

        default:
          if( !value.length && emptyIsTrue )
          {
            // empty is true
            return true;
          }

          return false;
      }
    case "number":
      // Everything but 0 is truthy
      return value === 0 ? false : true;

    case "boolean":
      return value;

    default:
      return !!value;
  }
}