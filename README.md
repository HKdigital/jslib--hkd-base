<div align="center" style="text-align: center; ">
  <br>
  <br>
  <img alt="HKdigital" src="doc/doc-include/HKdigital-logo.svg" style="height: 100px;" />
  <br>
  <br>
</div>

<div align="center" style="text-align: center;">
  <h1>Base library for javascript projects by HKdigital</h1>
  <br>
</div>

## About

This library contains base code that gives you a quick start when creating a Javascript application. The code can be run in NodeJS or in a browser.

Most other Javascript libraries created by HKdigital depend on this library.

### Issues
If you encounter problems or have a good idea to make this library better, please create an [issue](https://github.com/HKdigital/jslib-hkd-base/issues).

## Setup a project using the Devtool

The [HKdigital devtool](https://github.com/HKdigital/hkdigital-jsdevtool) can be used to setup a NodeJS (backend) or SVELTE (frontend) project from scratch.

### Add libraries to your project

You can add libraries to your project as git submodules.

To add a library (which is a git submodule) to the folder `/lib/jslib--hkd-base`:

```bash
node devtool.mjs submodule-add git@github.com:HKdigital/jslib--hkd-base.git
```

The devtool includes support for import aliases, so you can refer to library files like this:

```js
import { expectString } from "@hkd-base/helpers/expect.js";
```
