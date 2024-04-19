
// import { resolve } from "path";

// import { getCustomAliases } from "./aliases.mjs";

// // getDefaultAliasEntries

// function resolveCurrentLibPath()
// {
//   return resolve( "./", ...arguments );
// }

// const aliases = await getCustomAliases( { resolveCurrentLibPath } );

// console.log( { aliases} );

// const customAliases = {};

// const fs = require("fs");

// if( fs.existsSync() )
// {
// }

console.log('TODO: import custom aliases');

export default async () => {
  return {
    verbose: true,
    rootDir: '../',
    // testRegex: '.spec.js$',
    testEnvironment: 'node', // 'node' and 'jsdom' support out of the box

    //
    // @see
    //   https://blog.ah.technology/
    //     a-guide-through-the-wild-wild-west-of-
    //     setting-up-a-mono-repo-part-2-adding-jest-with-a-breeze-16e08596f0de
    //
    moduleNameMapper: {
      '\\@rootDir/(.*)$': '<rootDir>/$1',
      // "\\./(.*)$": "<rootDir>/$1",
      '\\@hkd-base/(.*)$': '<rootDir>/$1',
      '\\@platform/(.*)$': '<rootDir>/$1'

      //"\\@hkd-some-other-lib(.*)$": "<rootDir>/../jslib--hkd-some-other-lib/$1",
    }

    // globals: {
    //   // NODE_ENV: "test"
    // }
  };
};