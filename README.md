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

## Add libraries to your project

You can add libraries to your project as git submodules.

Checkout [HKdigital devtool](https://github.com/HKdigital/hkdigital-jsdevtool) to make this process a bit easier than doing everything with the git command line tool.

The devtool can als be used to setup a NodeJS (backend) or SVELTE (frontend) project for you from scratch.

e.g. to add a library (which is a git submodule) to the folder `/lib/jslib--hkd-base`:

```bash
node devtool.mjs submodule-add git@github.com:HKdigital/jslib--hkd-base.git
```
