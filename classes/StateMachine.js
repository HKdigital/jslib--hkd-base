
/* ------------------------------------------------------------------ Imports */

import { expectNotEmptyString,
         expectPositiveNumber,
         expectObject,
         expectFunction,
         expectError }
  from "@hkd-base/helpers/expect.js";

import { delay }
  from "@hkd-base/helpers/time.js";

import { setReadOnlyProperty,
         objectGet }
  from "@hkd-base/helpers/object.js";

import ValueStore
  from "@hkd-base/classes/ValueStore.js";

import StateTransition
  from "@hkd-base/classes/StateTransition.js";

import "@hkd-base/typedef/StateMachineMessage.type.js";
import "@hkd-base/typedef/StateMachineState.type.js";

/* ---------------------------------------------------------------- Internals */

const DEFAULT_MAX_STEPS = 1000;
const DEFAULT_MAX_MS = 60000;

/* ------------------------------------------------------------------ Exports */

export const IDLE = "idle";

export const ERROR = "error";

/* ------------------------------------------------------------- Export class */

export default class StateMachine extends ValueStore
{
  /**
   * Object that contains all states by label
   *
   * @type {Object}
   */
  statesByLabel = {};

  /**
   * Two level object, indexed by [from] and [to] that contains
   * transition objects
   *
   * @type {Object}
   */
  transitionsFromTo = {};

  /**
   * Error store
   * - Contains the last error caused by transitions of the state machine
   *
   * @type {Object}
   */
  error;

  enableDebug = false;

  /**
   * Debug log store
   *
   * @type {boolean}
   */
  debug;

  /**
   * Construct a new instance
   * - Extends ValueStore, so can be subscribed to. The store with contain
   *   objects of type `StateMachineMessage`.
   */
  constructor( { enableDebug=false }={} )
  {
    super( { current: null, next: null } );

    // TODO: initial
    // TODO: allowed

    if( enableDebug )
    {
      this.debug = new ValueStore( null );
    }

    this.error = new ValueStore( null );
  }

  /* --------------------------------------------------------- Public methods */

  /**
   * Add a state
   *
   * @param {Object} _
   * @param {String} _.label
   * @param {Object} [_.context={}]
   * @param {Boolean} [_.overwrite=false]
   *
   * @returns {StateMachine} this (for daisy chaining)
   */
  addState( { label, context={}, overwrite=false }={} )
  {
    expectNotEmptyString( label,
      "Missing or invalid parameter [label]" );

    expectObject( context,
      "Invalid parameter [context]" );

    if( !overwrite && label in this.statesByLabel )
    {
      throw new Error(`State [${label}] already exists`);
    }

    setReadOnlyProperty( context, "label", label );

    this.statesByLabel[ label ] = context;

    if( !this.transitionsFromTo[ label ] )
    {
      this.transitionsFromTo[ label ] = {};
    }

    return this;
  }

  // ---------------------------------------------------------------------------

  /**
   * Add a transition
   *
   * @param {String} from - From state label
   * @param {String} to - To state label
   * @param {StateTransition} [transition]
   *
   * @param {number} [delayMs]
   *   If specified, a "delay transition" will be created instead of a
   *   custom transition
   *
   * @param {function} [onStart]
   *   Function to call when transition starts
   *
   * @param {function} [onEnded]
   *   Function to call when transition ended
   *
   * @returns {StateMachine} this (for daisy chaining)
   */
  addTransition( { from, to, transition, delayMs, onStart, onEnded } )
  {
    expectNotEmptyString( from,
      "Missing or invalid parameter [from]" );

    expectNotEmptyString( to,
      "Missing or invalid parameter [to]" );

    if( delayMs !== undefined )
    {
      expectPositiveNumber( delayMs,
        "Invalid value for parameter [delayMs]" );

      if( transition )
      {
        throw new Error(
          `Parameters [transition] and [delayMs] are mutually exclusive`);
      }

      transition = new StateTransition();

      transition.addStep( async () =>
        {
          await delay( delayMs );
        }  );
    }

    expectObject( transition,
      "Missing or invalid parameter [transition]" );

    expectFunction( transition.step,
      "Missing or invalid parameter [transition.step]" );

    if( transition.cancel )
    {
      expectFunction( transition.cancel,
      "Invalid parameter [transition.cancel]" );
    }

    if( !transition._maxSteps )
    {
      // Set max steps to prevent transitions of never ending
      setReadOnlyProperty( transition, "_maxSteps", DEFAULT_MAX_STEPS );
    }

    if( !transition._maxMs )
    {
      // Set max ms to prevent transitions of never ending
      setReadOnlyProperty( transition, "_maxMs", DEFAULT_MAX_MS );
    }

    if( onStart )
    {
      expectFunction( onStart,
        "Invalid value for parameter [onStart]" );

      transition.registerOnStartCallback( onStart );
    }

    if( onEnded )
    {
      expectFunction( onEnded,
      "Invalid value for parameter [onEnded]" );

      transition.registerOnEndedCallback( onEnded );
    }


    if( !this.transitionsFromTo[ from ] )
    {
      this.transitionsFromTo[ from ] = {};
    }

    this.transitionsFromTo[ from ][ to ] = transition;

    return this;
  }

  // ---------------------------------------------------------------------------

  /**
   * Jump to the specified state without transition
   *
   * @param {string} toLabel
   *
   * @returns {StateMachine} this (for daisy chaining)
   */
  async jumpTo( toLabel )
  {
    expectNotEmptyString( toLabel,
      "Missing or invalid parameter [toLabel]" );

    const toState = this.statesByLabel[ toLabel ];

    if( !toState )
    {
      throw new Error(`State [${toLabel}] does not exist`);
    }

    this.set( { current: toState } );

    return this;
  }

  // ---------------------------------------------------------------------------

  /**
   * Goto the specified state
   *
   * @param {String} toLabel
   *
   * @returns {Promise<true>} promise that resolves when the state has changed
   */
  async gotoState( toLabel )
  {
    expectNotEmptyString( toLabel,
      "Missing or invalid parameter [toLabel]" );

    const toState = this.statesByLabel[ toLabel ];

    if( !toState )
    {
      throw new Error(`State [${toLabel}] does not exist`);
    }

    const fromState = this.get()?.current;

    if( !fromState )
    {
      throw new Error(`Current state has not been set`);
    }

    const fromLabel = fromState.label;

    if( fromLabel === toLabel )
    {
      // Already in the specified state
      return;
    }

    if( this.debug )
    {
      this.debug.set(
        { msg: `gotoState [${fromLabel}] => [${toState.label}]` }
      );
    }

    const transition =
      objectGet( this.transitionsFromTo, [ fromLabel, toLabel ] );

    if( !transition )
    {
      //
      // Jump to state without transition
      //
      this.set( { current: toState, next: null }, true );

      return true;
    }

    this.set( { current: fromState, next: toState }, true );

    await this._transition( { toState, fromState, transition } );

    this.set( { current: toState, next: null }, true );

    return true;
  }

  // ---------------------------------------------------------------------------

  /**
   * Cancel the current transition
   * - Calls the `cancel` method of the transition (if any)
   * - Removes the `next state`
   *
   * @returns {Error} error if cancel transition failed
   */
  async cancelCurrentTransition()
  {
    // -- Get current state, next state and transition

    const toState = this.get()?.next;

    if( !toState )
    {
      // Currently not in a transition
      return;
    }

    const fromState = this.get()?.current;

    if( !fromState )
    {
      throw new Error( `Current state has not been set` );
    }

    const transition = this._getCurrentTransition();

    // -- Run `cancel function` from current transition

    const cancelFn = transition?.cancel;

    if( cancelFn )
    {
      try {
        await cancelFn( { toState,
                          fromState } );
      }
      catch( e )
      {
        throw new Error(
          `Cancel current transition ` +
          `[${fromState.label}] => [${toState.label}] failed`,
          { cause: e } );
      }
    }

    // -- Remove `next state`

    this.set( { current: fromState, next: null } );
  }

  // ---------------------------------------------------------------------------

  /**
   * Get current transition
   *
   * @returns {object|null} current transition or null if there is none
   */
  _getCurrentTransition()
  {
    const fromState = this.get()?.current;

    if( !fromState )
    {
      throw new Error(`Current state has not been set`);
    }

    const toState = this.get()?.next;

    if( !toState )
    {
      // No next state
      // => not in a transition
      return null;
    }

    const transition =
      objectGet(
        this.transitionsFromTo, [ fromState.label, toState.label ] );

    return transition;
  }

  // ---------------------------------------------------------------------------

  /**
   * Transition the the next state
   *
   * @param {Object} _
   * @param {Object} _.toState
   * @param {Object} _.fromState
   * @param {Object} _.transition
   *
   * @throws {Error} transition failed
   */
  async _transition( { toState, fromState, transition } )
  {
    expectObject( toState,
      "Missing or invalid parameter [toState]" );

    expectObject( fromState,
      "Missing or invalid parameter [fromState]" );

    expectObject( transition,
      "Missing or invalid parameter [transition]" );

    const maxSteps = transition._maxSteps;
    const maxMs = transition._maxMs;

    const startedAt = Date.now();

    let stepsBefore = 0;

    let now;
    let elapsedMs;

    let done = false;

    try {
      do
      {
        now = Date.now();
        elapsedMs = now - startedAt;

        const result =
          await transition
            .step(
              {
                toState,
                fromState,

                stepsBefore,
                startedAt,
                elapsedMs
              } );


        done = result?.done;
        stepsBefore = stepsBefore + 1;
      }
      while( !done && stepsBefore < maxSteps && elapsedMs < maxMs );

      if( stepsBefore === maxSteps )
      {
        throw new Error(
          `Transition failed: max steps [${maxSteps}] reached`);
      }
      if( elapsedMs >= maxMs )
      {
        throw new Error(
          `Transition failed: max transition time reached [${maxMs}]`);
      }
    }
    catch( transitionError )
    {
      try {
        await this.cancelCurrentTransition();
      }
      catch( cancelError )
      {
        throw new Error(
          `Transition failed [${fromState.label}] => [${toState.label}], ` +
          `followed by cancelCurrentTransition() failure.`,
          { cause: [ cancelError, transitionError ] } );
      }

      throw new Error(
        `Transition failed [${fromState.label}] => [${toState.label}]`,
        { cause: transitionError } );
    }
  }

  // ---------------------------------------------------------------------------

  /**
   * Set the loading status to `ERROR`
   *
   * @param {Error} error
   */
  setError( error )
  {
    expectError( error, "Missing or invalid parameter [error]" );

    this.lastErrorMessage.set( error.message );

    this.set( ERROR );
  }

} // end class
