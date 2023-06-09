/**
 * ws.js
 *
 * @description
 * This file contains functions that can be used to work easily with WebSockets.
 *
 * Global WebSocketStore's can be created:
 * - Subscribe to a WebsocketStore to receive data that was send by the
 *   WebSocket backend
 * - Set a store value to set data to the WebSocket backend
 *
 * --
 *
 * The functions in this file use configuration data from a global config.
 *
 * @see global-config.js
 *
 * So websocket connections must be defined first in the global config:
 *
 * @example
 *   import { KEY_DEFAULT_WS_SERVER } from "@hkd-base/helpers/ws.js";
 *
 *   setGlobalConfig( KEY_DEFAULT_WS_SERVER,
 *     {
 *       url: "ws://localhost:12302"
 *     } );
 *
 * @typedef WebSocketStoreConfig
 *
 * @property {string} url the WebSocket url
 *
 * @property {*} [initialValue=null]
 *   Store value used before first response from the server if present
 *
 * @property {string[]} socketOptions
 *   Options transparently passed to the WebSocket constructor
 *
 * @property {string[]} [minReconnectDelay=1000]
 *   Minimal delay before trying to reconnect
 *
 * @property {string[]} [maxReconnectDelay=2000]
 *   Maximum delay before trying to reconnect
 */

/* ------------------------------------------------------------------ Imports */

import {
  expectNotEmptyString,
  expectPositiveNumber,
  expectDefined,
  expectObject } from "../helpers/expect.js";

import { getGlobalConfig } from "../helpers/global-config.js";

const stores = new Map();

/* ------------------------------------------------------------------ Exports */

export const KEY_DEFAULT_WS_SERVER = "default-ws-server";

// -----------------------------------------------------------------------------

/**
 * Get an existing websocket store
 *
 * @param {string} [label=KEY_DEFAULT_WS_SERVER]
 *
 * @returns {object|null} WebsocketStore or null if not found
 */
export function getWebsocketStore( label=KEY_DEFAULT_WS_SERVER )
{
  expectNotEmptyString( label, "Missing or invalid parameter [label]" );

  const store = stores.get( label );

  if( !store )
  {
    throw new Error(`WebsocketStore [${label}] does not exist`);
  }

  return store;
}

// -----------------------------------------------------------------------------

/**
 * Delete an existing websocket store
 *
 * @param {string} [label=KEY_DEFAULT_WS_SERVER]
 */
export function deleteWebsocketStore( label=KEY_DEFAULT_WS_SERVER )
{
  stores.delete( label );
}

// -----------------------------------------------------------------------------

/**
 * Create a writable store based on a web-socket.
 * Data is transferred as JSON.
 * Keeps socket open (reopens if closed) as long as there are subscriptions.
 *
 * @param {string} [label=KEY_DEFAULT_WS_SERVER]
 *
 * @returns {object} Store instance
 */
export function createWebsocketStore( label=KEY_DEFAULT_WS_SERVER )
{
  const config = getGlobalConfig( label );

  expectObject( config,
    `Missing global config [${KEY_DEFAULT_WS_SERVER}]` );


  const {
    url,
    initialValue=null,
    socketOptions,
    minReconnectDelay=10000,
    maxReconnectDelay=20000 } = config;

  expectNotEmptyString( url,
    "Missing or invalid parameter [url]" );

  expectPositiveNumber( minReconnectDelay,
    "Missing or invalid parameter [minReconnectDelay]" );

  expectPositiveNumber( maxReconnectDelay,
    "Missing or invalid parameter [maxReconnectDelay]" );

  let socket, openPromise, reopenTimeoutHandler;

  const subscriptions = new Set();

  /**
   * Close websocket and cancel reconnect
   */
  function close()
  {
    if( reopenTimeoutHandler )
    {
      // Cancel reopen timeout
      clearTimeout(reopenTimeoutHandler);
    }

    if( socket )
    {
      socket.close();
      socket = undefined;
    }
  }

  /**
   * Reopen websocket if there are still subscribers
   */
  function reopen()
  {
    close();

    if( subscriptions.size > 0 )
    {
      const delayMs =
        Math.floor(
          minReconnectDelay +
          Math.random() * (maxReconnectDelay - minReconnectDelay) );

      reopenTimeoutHandler =
        setTimeout(
          open,
          delayMs );
    }
  }

  /**
   * Open websocket connection
   */
  async function open()
  {
    // console.log("open", openPromise);

    if( socket && socket.readyState === WebSocket.OPEN )
    {
      //
      // The connection is open, but there is no openPromise..
      //

      return Promise.resolve();
    }

    if( openPromise )
    {
      // Return existing open promise
      return openPromise;
    }

    if( reopenTimeoutHandler )
    {
      clearTimeout( reopenTimeoutHandler );
      reopenTimeoutHandler = undefined;
    }

    socket = new WebSocket( url, socketOptions );

    socket.onmessage =
      ( event ) => {
        const parsedValue = JSON.parse( event.data );

        subscriptions.forEach( subscription => subscription( parsedValue ) );
      };

    socket.onclose = reopen;

    openPromise =
      new Promise(
        (resolve, reject) => {

          socket.onerror = error => {
            reject( error );
            openPromise = undefined;
          };

          socket.onopen = event => {
            resolve();
            openPromise = undefined;
          };

        });

    return openPromise;
  } // end fn open

  /**
   * Set a websocket store value (=sendMessage)
   *
   * @param {*} value
   *   Value to set in the websocket store. This value will also be send to
   *   the websocket server.
   */
  function setStoreValue( value )
  {
    // console.log("setStoreValue", value);

    let unsubscribe;

    if( !socket )
    {
      //
      // No subscribers yet
      // -> subscribe now to open websocket
      //
      unsubscribe = subscribe( () => {} );
    }

    const send = () => socket.send( JSON.stringify(value) );

    // console.log( "socket.readyState", socket.readyState, WebSocket.OPEN );

    if( socket.readyState !== WebSocket.OPEN )
    {
      // Websocket is not open yet, open first, then send

      open().then( () => {
        // Asume open failed if connection took to long
        // => message will never be send
        // => no timeout needed

        send();
        if( unsubscribe ) { unsubscribe(); }
      }  );
    }
    else {
      send();
      if( unsubscribe ) { unsubscribe(); }
    }
  }

  /**
   * Subscribe to the websocket store
   * - Registers a listener that will be called when the websocket store
   *   value is updated
   *
   * @param {function} listener
   */
  function subscribe( listener )
  {
    open();
    listener( initialValue );

    subscriptions.add( listener );

    // console.log("subscribed", subscriptions);

    return () => {
      // console.log("unsubscribe", listener );

      subscriptions.delete( listener );

      if( subscriptions.size === 0 )
      {
        // No more subscribers -> close websocket

        console.log("No more subscribers -> close websocket");

        //
        // Closing websocket after a delay
        // - Prevent closing of websocket when navigation between views
        //   (unsubscribe followed by quick resubscribe)
        //
        // setTimeout( () => {
        //   if( subscriptions.size === 0 )
        //   {
        //     console.log("close!");
        //     close();
        //   }
        // },
        // 5000 );
        close();
      }
    };
  }

  /**
   * Set a value at regular intervals until cancelled
   *
   * @param {function|*} valueOrFunction
   *   Value to set or function that returns the value to be set
   *
   * @param {Number} [intervalMs=2000]
   */
  function setRepeated( valueOrFunction, intervalMs=2000 )
  {
    expectPositiveNumber( intervalMs,
      "Invalid value for parameter [intervalMs]" );

    let timer;

    function getAndSetValue( force=false )
    {
      let value;

      if( typeof valueOrFunction === "function" )
      {
        value = valueOrFunction();
      }
      else {
        value = valueOrFunction;
      }

      expectDefined( value, "setRepeated: [value] should be defined" );

      setStoreValue( value );
    }

    // Set first value
    getAndSetValue();

    // Set value at regular intervals
    timer = setInterval( getAndSetValue, intervalMs );

    return function cancelSetRepeated() {
      clearInterval( timer );
    };
  }

  const store =
    {
      set: setStoreValue,
      setRepeated,
      subscribe
    };

  if( label )
  {
    expectNotEmptyString( label, "Invalid value for parameter [label]" );

    stores.set( label, store );
  }

  return store;
}
