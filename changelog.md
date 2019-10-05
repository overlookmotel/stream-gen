# Changelog

## 2.0.1

Doc:

* README update
* Update year in license

## 2.0.0

Breaking changes:

* Drop support for Node v6

Features:

* `bytes` option

Bug fixes:

* Name symbols

Performance:

* Clear up streams by setting props to undefined
* Do not save all options on stream

Refactor:

* Move entry point to `index.js`
* ES6 classes
* Split into multiple files
* Move stream options code to shared file
* Fix lint errors

Tests:

* Test with handcoded generator
* Split tests into multiple files
* Formatting in tests

Dev:

* CI run on Node v12
* Add `package-lock.json`
* Rename `travis` npm script to `ci`
* Use Jest for tests
* Lint with ESLint
* Update dev dependencies
* Git ignore `npm-debug.log`
* NPM ignore `.DS_Store`
* `.gitattributes` file

Doc:

* Reverse order of changelog

## 1.0.1

* Fix changelog

## 1.0.0

* Initial release
