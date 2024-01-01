/**
 * time.js
 *
 * @description
 * This file contains time related functionality
 *
 * @example
 *
 *   import { delay, now } from './time.js';
 *
 *   async function test()
 *   {
 *     console.log( `Current timestamp [${now()}]` );
 *
 *     await delay( 1000 );
 *
 *     console.log( `Current timestamp [${now()}]` );
 *   }
 */

/* ------------------------------------------------------------------ Imports */

import { expectPositiveNumber } from "./expect.js";
import { HkPromise } from "./promises.js";

/* ---------------------------------------------------------------- Internals */

let _aheadOfReferenceTimeMs = 0;

/* ------------------------------------------------------------------ Exports */

export const SECOND_MS = 1000;
export const MINUTE_MS = 60 * SECOND_MS;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;
export const WEEK_MS = 7 * DAY_MS;

export const TIME_2020_01_01 = 1577836800000; // 2020-01-01T00:00:00.000Z
export const TIME_2100_01_01 = 4102444800000; // 2100-01-01T00:00:00.000Z

export const JANUARY = "January";
export const FEBRUARY = "February";
export const MARCH = "March";
export const APRIL = "April";
export const MAY = "May";
export const JUNE = "June";
export const JULY = "July";
export const AUGUST = "August";
export const SEPTEMBER = "September";
export const OCTOBER = "October";
export const NOVEMBER = "November";
export const DECEMBER = "December";

export const MONTH_NAME_LABELS_EN =
  [
    JANUARY, FEBRUARY, MARCH, APRIL, MAY, JUNE,
    JULY, AUGUST, SEPTEMBER, OCTOBER, NOVEMBER, DECEMBER
  ];

export const MONDAY = "Monday";
export const TUESDAY = "Tuesday";
export const WEDNESDAY = "Wednesday";
export const THURSDAY = "Thursday";
export const FRIDAY = "Friday";
export const SATURDAY = "Saturday";
export const SUNDAY = "Sunday";

export const DAY_NAME_LABELS_EN =
  [
    MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
  ];

// -- Intervals

export const HOURLY = "hourly";
export const DAILY = "daily";
export const WEEKLY = "weekly";
// export const TWO_WEEKLY = "two-weekly";
// export const FOUR_WEEKLY = "four-weekly";

export const INTERVALS_MS =
  {
    [ HOURLY ]: HOUR_MS,
    [ DAILY ]: DAY_MS,
    [ WEEKLY ]: WEEK_MS,
    // [ TWO_WEEKLY ]: WEEK_MS * 2,
    // [ FOUR_WEEKLY ]: WEEK_MS * 4,
  };

// -----------------------------------------------------------------------------

/**
 * Returns a server synchronized time stamp like `Date.now()`
 * - Returns number of milliseconds since the UNIX EPOCH (1-1-1970),
 * - The method `setServerTime` can be used to synchronize the time
 *
 * @return {number} server synchronized timestamp
 */
export function getSynchedTime()
{
  const now = Date.now();

  if( _aheadOfReferenceTimeMs )
  {
    return now - _aheadOfReferenceTimeMs;
  }

  return now;
}

// -----------------------------------------------------------------------------

/**
 * Set reference time
 * - The reference time is used when using the `getSynchedTime`
 * - The reference time can be e.g. a time stamp fetched from a server
 *
 * @param {number} referenceTimeMs - Time on the server
 */
export function setReferenceTime( referenceTimeMs )
{
  expectPositiveNumber( referenceTimeMs,
    "Missing or invalid parameter [referenceTimeMs]" );

  _aheadOfReferenceTimeMs = Date.now() - referenceTimeMs;
}

// -----------------------------------------------------------------------------

/**
 * Returns a promise that resolves after a specified timeout
 * - If the returned promise is rejected, the timeout is cancelled
 *
 * @param  {number} delayOrMinDelayMs
 *   Number of milliseconds to wait before promise resolves
 *
 * @param  {number} [maxDelayMs=delayOrMinDelayMs]
 *   Maximum number of milliseconds to wait before the returned promise
 *   resolves. If this parameter is set, the delay will be chosen randomly
 *   between the values [delayOrMinDelayMs, maxDelayMs]
 *
 * @returns {Promise} promise that resolves after a specified timeout
 */
export function delay( delayOrMinDelayMs, maxDelayMs )
{
  if( typeof delayOrMinDelayMs !== "number" )
  {
    throw new Error("Invalid or missing parameter [delayOrMinDelayMs]");
  }

  if( maxDelayMs )
  {
    //
    // maxDelayMs was set -> generate random delay
    //
    if( maxDelayMs > delayOrMinDelayMs )
    {
      delayOrMinDelayMs =
        Math.floor(
          delayOrMinDelayMs +
          Math.random() * (maxDelayMs-delayOrMinDelayMs) );
    }
  }

  const promise = new HkPromise();

  let timer =
    setTimeout( () =>
      {
        timer = null;
        promise.resolve();
      },
      delayOrMinDelayMs );

  // Register catch method to cancel timer when promise is rejected
  promise.catch( () =>
    {
      if( timer )
      {
        clearTimeout( timer );
        timer = null;
      }
    } );

  return promise;
}

// -----------------------------------------------------------------------------

/**
 * Get the number of milliseconds since the specified time stamp of the default
 * reference time stamp TIME_2020_01_01
 *
 * @param {number} [sinceMs=TIME_2020_01_01]
 *
 * @returns {number} number of milliseconds since the specified time
 */
export function sinceMs( sinceMs=TIME_2020_01_01 )
{
  return Date.now() - sinceMs;
}

// -----------------------------------------------------------------------------

/**
 * Get a string that represents the time in a readable
 * string format: [DD:][HH:]MM:SS.mmm
 *
 * @param {number} timeMs [description]
 *
 * @returns {string} time in human readable format
 */
export function timeToString( timeMs )
{
  const days = Math.floor( timeMs / DAY_MS );

  let restMs = timeMs - days * DAY_MS;

  const hours = Math.floor( restMs / HOUR_MS );

  restMs = restMs - hours * HOUR_MS;

  const minutes = Math.floor( restMs / MINUTE_MS );

  restMs = restMs - minutes * MINUTE_MS;

  const seconds = Math.floor( restMs / SECOND_MS );

  restMs = restMs - seconds * SECOND_MS;

  let str = "";

  if( days )
  {
    str += `${days.toString().padStart( 2, "0")}:`;
    str += `${hours.toString().padStart( 2, "0")}:`;
  }
  else if( hours )
  {
    str += `${hours.toString().padStart( 2, "0")}:`;
  }

  str += `${minutes.toString().padStart( 2, "0")}:`;
  str += `${seconds.toString().padStart( 2, "0")}.`;
  str += `${restMs.toString().padEnd( 3, "0" )}`;

  return str;
}

// -----------------------------------------------------------------------------

/**
 * Returns a Date object
 * - The input can be a Date object or a numeric timestamp
 *
 * @param {Date|number} dateOrTimestamp
 *
 * @returns {Date} date object
 */
export function toDate( dateOrTimestamp )
{
  if( dateOrTimestamp instanceof Date )
  {
    return dateOrTimestamp;
  }

  if( typeof dateOrTimestamp === "number" )
  {
    return new Date( dateOrTimestamp );
  }

  throw new Error("Missing or invalid parameter [dateOrTimestamp]");
}

// -----------------------------------------------------------------------------

/**
 * Get the ISO 8601 week number of the specified date
 *
 * @see https://stackoverflow.com
 *      /questions/6117814/get-week-of-year-in-javascript-like-in-php
 *
 * @param {Date|number} dateOrTimestamp
 *
 * @returns {number} week number
 */
export function getWeekNumber( dateOrTimestamp )
{
  let date = toDate( dateOrTimestamp );

  //
  // Create a copy of this date object
  //
  const target = new Date( date.valueOf() );

  //
  // ISO week date weeks start on Monday, so correct the day number
  //
  var dayNumber = ( date.getDay() + 6 ) % 7;

  //
  // ISO 8601 states that week 1 is the week with the first Thursday
  // of that year.
  //
  // Set the target date to the Thursday in the target week
  //
  target.setDate( target.getDate() - dayNumber + 3 );

  //
  // Store the millisecond value of the target date
  //
  const firstThursday = target.valueOf();

  // Set the target to the first Thursday of the year
  // First, set the target to January 1st
  target.setMonth( 0, 1 );

  //
  // Not a Thursday? Correct the date to the next Thursday
  //
  if( target.getDay() !== 4 )
  {
    target.setMonth( 0, 1 + ( (4 - target.getDay()) + 7) % 7 );
  }

  //
  // The week number is the number of weeks between the first Thursday
  // of the year and the Thursday in the target week
  // (604800000 = 7 * 24 * 3600 * 1000)
  //
  return 1 + Math.ceil( (firstThursday - target) / 604800000 );
}

// -----------------------------------------------------------------------------

/**
 * Get the name of the month
 * - Returns the English name of the month
 *
 * - Use the output as label in combination with the functions
 *   text() and translate() for international month names
 *
 * e.g.
 *
 * setTranslations()
 * ...
 *
 * text( getMonthName( new Date() ) );
 *
 * --
 *
 * @param {Date|number} dateOrTimestamp
 *
 * @returns {string} name of the month (English)
 */
export function getMonthName( dateOrTimestamp )
{
  return MONTH_NAME_LABELS_EN[ toDate( dateOrTimestamp ).getMonth() ];
}

// -----------------------------------------------------------------------------

/**
 * Get the name of the day
 * - Returns the English name of the day
 *
 * - Use the output as label in combination with the functions
 *   text() and translate() for international day names
 *
 * e.g.
 *
 * setTranslations()
 * ...
 *
 * text( getDayName( new Date() ) );
 *
 * --
 *
 * @param {Date|number} dateOrTimestamp
 *
 * @returns {string} name of the day (English)
 */
export function getDayName( dateOrTimestamp )
{
  return DAY_NAME_LABELS_EN[ toDate( dateOrTimestamp ).getDay() ];
}

// -----------------------------------------------------------------------------

/**
 * Return the timestamp of the start of the day
 * - Midnight + 1 millisecond
 *
 * @returns {number} timestamp of start of the day
 */
export function getTimeAtStartOfDay()
{
  const d = new Date();
  d.setHours(0);
  d.setMinutes(0);
  d.setSeconds(0);
  d.setMilliseconds(1);

  return d.getTime();
}

