
/**
 * Returns a boolean.
 * - Returns true if the value is truthy, false otherwise
 * - A return value can be specified in case an "empty string" is supplied as
 *   value
 *
 * @param {*} value
 *
 * @param {boolean} [returnValueForEmptyString=false]
 *
 * @returns {boolean} true if the value is truthy
 */
export function toBoolean( value, returnValueForEmptyString=false )
{
  switch( typeof value )
  {
    case 'string':
      switch( value )
      {
        case '1', 'true':
          return true;

        default:
          if( !value.length )
          {
            return returnValueForEmptyString;
          }

          return false;
      }
    case 'number':
      // Everything but 0 is truthy
      return value === 0 ? false : true;

    case 'boolean':
      return value;

    default:
      return !!value;
  }
}