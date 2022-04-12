# Base library for javascript projects by HKdigital

## About

This library contains base code that gives you a quick start when creating a Javascript application. The code can be run in NodeJS or in a browser.

Most other Javascript libraries created by HKdigital depend on this library.

## Add libraries to your project

You can add libraries to your project as git submodules. But Checkout [HKdigital devtool](https://github.com/HKdigital/hkdigital-devtool) if you want to start a Javascript project from scratch. This devtool can setup a NodeJS (backend) or SVELTE (frontend) project for you.

### Add libraries to you project

The devtool can help you to add (or remove) libraries to you project:

e.g. to add a library (which is a git submodule) to the folder `/lib/hkd-jslib-base`:

```bash
node devtool.mjs submodule-add git@github.com:HKdigital/hkd-jslib-base.git
```
