
/* ------------------------------------------------------------------ Imports */

import { expectNumber,
         expectFunction }
  from '@hkd-base/helpers/expect.js';

import ValueStore
  from '@hkd-base/classes/ValueStore.js';

/* ---------------------------------------------------------------- Internals */

const processor$ = Symbol('processor');

const url$ = Symbol('url');

const data$ = Symbol('data');

const eventSource$ = Symbol('eventSource');

const connect$ = Symbol('connect');
const disconnect$ = Symbol('disconnect');

const autoReconnect$ = Symbol('autoReconnect');

const destroyed$ = Symbol('destroyed');

/* ------------------------------------------------------------------ Exports */

export default class Feed
{
  // ---------------------------------------------------------------------------

  /**
   * Construct a Feed instance
   * - Connects to a server
   * - Receives an event data stream from the server
   * - Outputs events via the store `feed.data`
   *
   * @param {function} processor
   *   This processor function receives a single argument `eventOrError`,
   *   the context `this` is set to the `this` context of the feed instance
   *
   *   The value returned by  the processor is set in the store `feed.data`
   *
   * @param {object} [EventSourceClass=EventSource]
   *   EventSource class - especially for NodeJs where the global EventSource
   *   class is not available and a custom module should be used.
   */
  constructor( processor, EventSourceClass )
  {
    expectFunction( processor,
      'Missing or invalid parameter [processor]' );

    this[ processor$ ] = ( eventOrError ) => {

      if( !(eventOrError instanceof Error) &&
           'error' === eventOrError.type)
      {
        // console.log( eventOrError );

        eventOrError = new Error(
          `Received event of type [error] from [${this[ url$ ]}]`);
      }

      const value = processor.call( this, eventOrError );

      if( value === undefined )
      {
        throw new Error('Processor function should not return [undefined]');
      }

      this[ data$ ].set( value );
    };

    if( EventSourceClass )
    {
      this.EventSourceClass = EventSourceClass;
    }
     
    else if( EventSource !== undefined )
    {
       
      this.EventSourceClass = EventSource;
    }
    else {
      throw new Error(
        'Missing parameter [EventSourceClass] and ' +
        'global [EventSOurce] is not available');
    }

    // --

    this[ destroyed$ ] = false;

    this[ url$ ] = null;
    this[ eventSource$ ] = null;

    const store =
      this[ data$ ] = new ValueStore( null );

    store.hasSubscribers.subscribe( ( hasSubscribers ) =>
    {
      if( !hasSubscribers )
      {
        // - No subscribers

        // console.log("DEBUG: No feed subscribers");

        this[ disconnect$ ]();
        return;
      }

      // - There are subscribers, connect if an url has been set

      // console.log("DEBUG: First feed subscriber");

      if( this[ url$ ] )
      {
        this[ connect$ ]();
      }

    } );
  }

  // ---------------------------------------------------------------------------

  /**
   * Get latest feed item
   *
   * @returns {object|null} latest feed item
   */
  get()
  {
    if( this[ destroyed$ ] )
    {
      throw new Error('Feed has been destroyed');
    }

    return this[ data$ ].get();
  }

  // ---------------------------------------------------------------------------

  /**
   * Subscribe to feed
   * -
   *
   * @param {function} callback - Function that will receive feed updates
   *
   * @returns {function} unsubscribe function
   */
  subscribe( /* callback */ )
  {
    if( this[ destroyed$ ] )
    {
      throw new Error('Feed has been destroyed');
    }

    return this[ data$ ].subscribe( ...arguments );
  }

  // ---------------------------------------------------------------------------

  /**
   * Configure
   *
   * @param {string|null} url
   * @param {boolean} [autoReconnect=false]
   */
  configure( { url, autoReconnect=false } )
  {
    if( this[ destroyed$ ] )
    {
      throw new Error('Feed has been destroyed');
    }

    //console.log( `Feed: configure [${url}]` );

    this[ autoReconnect$ ] = autoReconnect;

    if( url )
    {
      if( typeof url !== 'string' && !(url instanceof URL) )
      {
        throw new Error( 'Missing or invalid parameter [url]' );
      }
    }

    if( !url )
    {
      // console.log("Feed: configure: clear url");

      this[ url$ ] = null;

      this.disconnectAndSetNull();
      return;
    }

    if( this[ url$ ] && url !== this[ url$ ] )
    {
      // console.log(
      //   "Feed: configure: url changed",
      //   {
      //     oldUrl: this[ url$ ],
      //     newUrl: url
      //   } );

      // Url changed
      this.disconnectAndSetNull();
    }

    if( this[ eventSource$ ] )
    {
      throw new Error(
        'Property [eventSource] already defined (this should not happen)');
    }

    this[ url$ ] = url;

    if( true === this[ data$ ].hasSubscribers.get() )
    {
      // Subscribers and no event source -> not connected -> connect

      this[ connect$ ]();
    }
  }

  // ---------------------------------------------------------------------------

  /**
   * Manually inject a value into the feed
   *
   * @param {*} [value] - Value to store
   *
   * @returns {*} the value that was set
   */
  set( value)
  {
    return this[ data$ ].set(value );
  }

  // ---------------------------------------------------------------------------

  /**
   * Shutdown the feed
   * - Disconnects from the event source
   * - Sets `null` as last data value
   * - Unsubscribes all listeners
   *
   * @throws {AlreadyDestroyedError} if
   */
  destroy()
  {
    if( this[ destroyed$ ] )
    {
      throw new Error('Feed has already been destroyed');
    }

    this.disconnectAndSetNull();

    if( this[ data$ ] )
    {
      this[ data$ ].unsubscribeAll();
    }

    this[ destroyed$ ] = true;
  }

  // ---------------------------------------------------------------------------

  /**
   * Shutdown the feed
   * - Disconnects from the event source
   * - Sets `null` as last data value
   * - Unsubscribes all listeners
   */
  tryDestroy()
  {
    if( this[ destroyed$ ] )
    {
      return;
    }

    this.destroy();
  }

  // ---------------------------------------------------------------------------

  /**
   * Reconnect, e.g. after an error
   *
   * @param {number} [delay=5000]
   *   Number of milliseconds to wait before connecting again
   */
  reconnect( delay=5000 )
  {
    if( this[ destroyed$ ] )
    {
      throw new Error('Feed has been destroyed');
    }

    console.log(`reconnect [${delay}]`);

    expectNumber( delay, 'Invalid parameter [delay]' );

    this[ disconnect$ ]();
    setTimeout( () => {
      this[ connect$ ]();
    },
    delay );
  }

  // ---------------------------------------------------------------------------

  /**
   * Disconnect from server
   */
  disconnectAndSetNull()
  {
    if( this[ destroyed$ ] )
    {
      throw new Error('Feed has been destroyed');
    }

    // console.log( `Feed: disconnect and set null` );

    this[ disconnect$ ]();

    this[ data$ ].set( null );
  }

  /* ------------------------------------------------------- Internal methods */

  /**
   * Disconnect from the event source
   */
  [ disconnect$ ]()
  {
    if( this[ eventSource$ ] )
    {
      // console.log( `Feed: disconnect` );

      // throw new Error("FIXME: disconnect gets called while it shouldn't");

      this[ eventSource$ ].close();
      this[ eventSource$ ] = null;
    }
  }

  // ---------------------------------------------------------------------------

  /**
   * Create a new EventSource instance
   */
  [ connect$ ]()
  {
    // console.log( `Feed: connect` );

    //
    // Not needed to set data to null:
    //   - disconnect sets value null
    //   - event source will return a value soon
    //
    // this[ data$ ].set( null );
    //

    if( this[ eventSource$ ] )
    {
      throw new Error('Property [eventSource$] should be null');
    }

    let url = this[ url$ ];

    if( url instanceof URL )
    {
      // Needed for NodeJs EventSource implementation
      url = url.href;
    }

    this[ eventSource$ ] = new this.EventSourceClass( url );

    this[ eventSource$ ].addEventListener( 'message', this[ processor$ ] );

    this[ eventSource$ ].addEventListener( 'error', ( e ) => {
      this[ processor$ ]( e );

      if( this[ autoReconnect$ ] )
      {
        this.reconnect();
      }
    } );

    // this[ eventSource$ ].addEventListener( "error", () =>
    //   {
    //     this[ disconnect$ ]();
    //     setTimeout( () => { this[ connect$ ](); }, 5000 );
    //   } );
  }

}
