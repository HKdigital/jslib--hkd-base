// import _module from "jest-config";

// console.log( _module );
// process.exit();

// export default default;

import { resolve } from "path";

// import { getAliases } from "./aliases.mjs";

// // getDefaultAliasEntries

// function resolveCurrentLibPath()
// {
//   return resolve( "./", ...arguments );
// }

// const aliases = await getAliases( { resolveCurrentLibPath } );

// console.log( { aliases} );

// const customAliases =
//   {
//     "\\$hk(.*)$": "<rootDir>/../jslib-hkd-base/$1"
//   };

// const fs = require("fs");

// if( fs.existsSync() )
// {

// }

export default {
  verbose: true,
  rootDir: "../",
  // testRegex: '.spec.js$',
  testEnvironment: 'node', // 'node' and 'jsdom' support out of the box

  //
  // @see
  //   https://blog.ah.technology/
  //     a-guide-through-the-wild-wild-west-of-
  //     setting-up-a-mono-repo-part-2-adding-jest-with-a-breeze-16e08596f0de
  //
  moduleNameMapper: {
    "\\$rootDir/(.*)$": "<rootDir>/$1",
    "\\$hk/(.*)$": "<rootDir>/$1",
    "\\$hkd-base/(.*)$": "<rootDir>/$1",
    "\\$jslib-hkd-base/(.*)$": "<rootDir>/$1",
    "\\$eslib-hkd-base/(.*)$": "<rootDir>/$1"
    //"\\$hkd-some-other-lib(.*)$": "<rootDir>/../jslib-hsome-other-lib/$1",
  }

  // globals: {
  //   // NODE_ENV: "test"
  // }
};