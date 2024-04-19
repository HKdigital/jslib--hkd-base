/**
 * process.js
 *
 * @description
 * This file contains process related functionality/
 *
 * @example
 *
 *   import { defer } from './process.js';
 *
 *   defer( () => {
 *     console.log("The execution of the function has been defered");
 *   } );
 */

import { expectFunction }
  from '@hkd-base/helpers/expect.js';

/* ---------------------------------------------------------------- Internals */

/**
 * Detect and return the most suitable setImmediate implementation available
 * on the current platform
 */
function set_immediate_implementation()
{
  if( typeof global !== 'undefined' )
  {
    if( undefined !== global.setImmediate )
    {
      return global.setImmediate;
    }
  }
  else if( typeof window !== 'undefined' )
  {
    if( window.postMessage && window.addEventListener )
    {
      const queue = [];

      window.addEventListener('message', ( event ) =>
      {
        const source = event.source;

        if( (source === window || source === null) &&
             event.data === 'hkd-process-next-tick')
        {
          event.stopPropagation();
          if( queue.length > 0 )
          {
            const fn = queue.shift();
            fn();
          }
        }
      },
      true);

      return function nextTickUsingPostMessage( fn )
        {
          expectFunction( fn );

          queue.push(fn);
          window.postMessage('hkd-process-next-tick', '*');
        };
    }
  }

  throw new Error('No suitable [setImmediate] implementation available');
}

/* ------------------------------------------------------------------ Exports */

/**
 * Defer the execution of a function
 *  - Uses the best 'setImmediate' implementation supported by the current
 *    runtime environment
 *
 * @param {function} fn - Function to execute
 *
 * --
 *
 * @note setImmediate is preferred over nextTick
 *
 * @see https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/
 */
export const defer = set_immediate_implementation();
