
/* ------------------------------------------------------------------ Imports */

import { expectArray }
  from '@hkd-base/helpers/expect.js';

/* ------------------------------------------------------------------ Exports */

export default class ArrayIterator
{
  /**
   * Construct an array iterator
   *
   * @param {Array} arr - Array to use for iteration
   *
   * @param {object} [options] - Iteration options
   *
   * @param {number} [options.callback]
   *   Callback to call to process each item before it is outputted by the
   *   iterator
   *
   * @param {number} [options.reversed=false]
   *   If set to true: iterates the array in reversed order
   *
   * @returns {Iterator} iterable object
   *
   * --
   *
   * Example usage
   *
   *   const arr = [ { value: 1 }, { value: 2 }, { value: 3 } ];
   *
   *   const it = new ArrayIterator( arr );
   *
   *   const theValue = 2;
   *
   *   let item = null;
   *
   *   for( item of it )
   *   {
   *     if( item.value === theValue )
   *     {
   *       break;
   *     }
   *   } // end for
   *
   *   console.log( { item } );
   */
  constructor( arr, options )
  {
    //super( ...arguments );

    expectArray('Invalid parameter [arr]');

    options = Object.assign( { reversed: false, callback: null }, options );

    this.reversed = options.reversed;
    this.callback = options.callback;

    this.arr = arr;

    if( !this.reversed )
    {
      this.nextIndex = 0;
    }
    else {
      this.nextIndex = arr.length - 1;

      // Overwrite next function by reversed next function
      this.next = this.nextReversed;
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Implement @@iterator method
   *   -> object becomes iterable in for ... of loop
   */
  *[Symbol.iterator]()
  {
    let result = this._next();

    while( !result.done )
    {
      yield result.value;
      result = this._next();
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get the next value from the array
   * - Values are returned in reversed order: the last item from the array
   *   is returned first.
   *
   * @returns {mixed} current array item
   */
  nextReversed()
  {
    const arr = this.arr;
    const callback = this.callback;

    if( this.nextIndex >= 0 )
    {
      let value = arr[ this.nextIndex-- ];

      if( callback )
      {
        value = callback( value );
      }

      return {
        value,     // @note decrement nextIndex
        done: false
      };
    }
    else {
      return { done: true };
    }
  }

  // -------------------------------------------------------------------- Method

  /**
   * Get the next value from the array
   *
   * @returns {mixed} current array item
   */
  _next()
  {
    const arr = this.arr;
    const callback = this.callback;

    if( this.nextIndex < arr.length )
    {
      let value = arr[ this.nextIndex++ ];

      if( callback )
      {
        value = callback( value );
      }

      return {
        value,     // @note increment nextIndex
        done: false
      };
    }
    else {
      return { done: true };
    }
  }

} // end class
