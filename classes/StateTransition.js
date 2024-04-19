
/* ------------------------------------------------------------------ Imports */

import { expectFunction }
  from '@hkd-base/helpers/expect.js';

import { delay }
  from '@hkd-base/helpers/time.js';

import '@hkd-base/typedef/StateMachineTransition.type.js';

/* ---------------------------------------------------------------- Internals */

/**
 * Constructor function that is easier to use for chaining
 *
 * @param {function|number} nextStepFnOrDelayMs
 *
 * @returns {StateTransition}
 */
function newStateTransition()
{
  return new StateTransition( ...arguments );
}

/* ------------------------------------------------------------------ Exports */

export { newStateTransition };

/* ------------------------------------------------------------- Export class */

/**
 * @implements StateMachineTransition
 */
export default class StateTransition
{
  /**
   * List of step functions that should be executed sequentially
   * when the transition is triggers
   *
   * @type {function[]}
   */
  steps = [];

  /**
   * Function that is called when the transisiotn is cancelled
   *
   * @type {function|null}
   */
  cancelFn = null;

  /**
   * Current staep in the transition
   *
   * @type {number}
   */
  currentStep = 0;

  /**
   * List of functions to call before the transition starts
   *
   * @type {function[]}
   */
  onStartFns = [];

  /**
   * List of functions to call after the transition has ended
   *
   * @type {function[]}
   */
  onEndedFns = [];

  /**
   * Construct a new transition instance
   *
   * @param {function|number} nextStepFnOrDelayMs
   *
   */
  constructor( nextStepFnOrDelayMs )
  {
    if( typeof nextStepFnOrDelayMs === 'number' )
    {
      this.addStep( async () => { await delay( nextStepFnOrDelayMs ); }  );
    }

    if( typeof nextStepFnOrDelayMs === 'function' )
    {
      this.addStep( nextStepFnOrDelayMs );
    }
  }

  /* --------------------------------------------------------- Public methods */

  /**
   * Add a single step function that should be executed when the transition
   * is triggered.
   * - The function will be appended to the current list of step functions
   *
   * @param {function} nextStepFn
   *
   * @returns {StateTransition} this (for daisy chaining)
   */
  addStep( nextStepFn )
  {
    expectFunction( nextStepFn );

    this.steps.push( nextStepFn );

    return this;
  }

  // ---------------------------------------------------------------------------

  /**
   * Set a cancel function
   * -
   * @param {function} cancelFn
   *
   * @returns {StateTransition} this (for daisy chaining)
   */
  setCancelFunction( cancelFn )
  {
    expectFunction( cancelFn );

    this.cancelFn = cancelFn;

    return this;
  }

  // ---------------------------------------------------------------------------

  /**
   * Perform the next step in the transition
   *
   * @param {object} params
   * @param {object} params.toState
   * @param {string} params.toState.label
   *
   * @param {object} params.fromState
   * @param {string} params.fromState.label
   * @param {number} params.stepsBefore
   * @param {number} params.startedAt
   * @param {number} params.elapsedMs
   *
   * @returns {{ done: boolean }}
   */
  async step( params )
  {
    const steps = this.steps;

    // console.log( "****step:start", steps, this.currentStep );

    if( !steps?.length )
    {
      // No steps
      // => done
      // console.log( "****step:done (no steps)" );
      return { done: true };
    }

    if( 0 === this.currentStep )
    {
      try {
        for( const fn of this.onStartFns )
        {
          await fn();
        }
      }
      catch( e )
      {
        throw new Error(
          'Exception in transition onStart function',
          { cause: e });
      }
    }

    const nextStepFn = steps[ this.currentStep ];

    if( !nextStepFn )
    {
      // No next step fn
      // => done
      // console.log( "****step:done (no next step)" );
      return { done: true };
    }

    // -- Execute next step function

    await nextStepFn.call( this, params );

    // console.log( "****step:done" );

    // -- Prepare for next step

    this.currentStep++;

    if( this.currentStep === steps.length )
    {
      try {
        for( const fn of this.onEndedFns )
        {
          await fn();
        }
      }
      catch( e )
      {
        throw new Error(
          'Exception in transition onEnded function',
          { cause: e });
      }

      this.currentStep = 0;

      // console.log( "****step:done (all steps done)" );
      return { done: true };
    }

    return { done: false };
  };

  // ---------------------------------------------------------------------------

  /**
   * Cancel the current transition
   * - Executes the registered cancel function (if set)
   * - Resets the current step
   */
  async cancel( params )
  {
    if( this.cancelFn )
    {
      await this.cancelFn.call( this, params );
    }

    this.currentStep = 0;
  };

  // ---------------------------------------------------------------------------

  /**
   * Register a function that should be called when before the
   * transition starts
   *
   * @param {function} callbackFn
   */
  registerOnStartCallback( callbackFn )
  {
    expectFunction( callbackFn );

    this.onStartFns.push( callbackFn );
  }

  // ---------------------------------------------------------------------------

  /**
   * Register a function that should be called when after the
   * transition ended
   *
   * @param {function} callbackFn
   */
  registerOnEndedCallback( callbackFn )
  {
    expectFunction( callbackFn );

    this.onEndedFns.push( callbackFn );
  }


} // end class
