
/* ------------------------------------------------------------------ Imports */

import { expectError } from '@hkd-base/helpers/expect.js';

import ValueStore from '@hkd-base/classes/ValueStore.js';

/* ------------------------------------------------------------------ Exports */

export const STATUS_IDLE = 'idle';
export const STATUS_IN_PROGRESS = 'in-progress';
export const STATUS_OK = 'ok';
export const STATUS_ERROR = 'error';

/* ------------------------------------------------------------- Export class */

export default class Status extends ValueStore
{
  /**
   * Construct a new instance
   */
  constructor()
  {
    super( STATUS_IDLE );

    this.lastErrorMessage = new ValueStore( null );
  }

  /* --------------------------------------------------------- Public methods */

  /**
   * Set the submit status to `STATUS_IDLE`
   */
  setIdle()
  {
    this.lastErrorMessage.set( null );
    this.set( STATUS_IDLE );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Set the submit status to `STATUS_IN_PROGRESS`
   */
  setInProgress()
  {
    this.lastErrorMessage.set( null );
    this.set( STATUS_IN_PROGRESS );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Set the submit status to `STATUS_OK`
   */
  setOk()
  {
    this.lastErrorMessage.set( null );

    this.set( STATUS_OK );
  }

  // -------------------------------------------------------------------- Method

  /**
   * Set the status to `STATUS_ERROR`
   *
   * @param {Error} error
   */
  setError( error )
  {
    expectError( error, 'Missing or invalid parameter [error]' );

    this.lastErrorMessage.set( error.message );

    this.set( STATUS_ERROR );
  }

} // end class
