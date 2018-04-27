# stream-gen.js

# Create streams from generators and test them

## Current status

[![NPM version](https://img.shields.io/npm/v/stream-gen.svg)](https://www.npmjs.com/package/stream-gen)
[![Build Status](https://img.shields.io/travis/overlookmotel/stream-gen/master.svg)](http://travis-ci.org/overlookmotel/stream-gen)
[![Dependency Status](https://img.shields.io/david/overlookmotel/stream-gen.svg)](https://david-dm.org/overlookmotel/stream-gen)
[![Dev dependency Status](https://img.shields.io/david/dev/overlookmotel/stream-gen.svg)](https://david-dm.org/overlookmotel/stream-gen)
[![Greenkeeper badge](https://badges.greenkeeper.io/overlookmotel/stream-gen.svg)](https://greenkeeper.io/)
[![Coverage Status](https://img.shields.io/coveralls/overlookmotel/stream-gen/master.svg)](https://coveralls.io/r/overlookmotel/stream-gen)

## Purpose

Streams can be hard to test.

You want to test transform streams etc with large batches of data to ensure they're robust, but you don't want to include big files to test with in the repo.

This module provides:

* Readable stream which streams out data of whatever size you need
* Writable stream which receives data and checks it's what it should be

This is achieved entirely in memory (no file streams etc) but with minimal memory use.

The streams are created from a generator function you provide, which can produce streams of whatever content and size you require.

## Usage

### Installation

```
npm install stream-gen
```

### Classes

#### GeneratorReadStream( gen [, options] )

Readable stream that gets its content from a generator.

The generator must `yield` a byte value (0-255) each time it is called. The content of the stream is made up of these bytes.

```js
const { GeneratorReadStream } = require('stream-gen');

// Data generator - creates 1KB of data
function* gen() {
  for (let i = 0; i < 1024; i++) {
    yield i % 256;
  }
}

const producer = new GeneratorReadStream( gen );

producer.pipe( destination );
```

#### GeneratorWriteStream( gen [, options], callback )

Writable stream that receives content and compares them to result of a generator. It calls `callback` with result of the comparison.

The generator must be of same type as for `GeneratorReadStream`.

```js
const { GeneratorWriteStream } = require('stream-gen');

const checker = new GeneratorWriteStream( gen, function(err) {
  if (err) return console.log('Stream differed');
  console.log('Stream as expected');
} );

source.pipe( checker );
```

### Putting it together

The two parts work together to test that a transfer of data has been completed without altering the data.

Let's say you are testing a lossless compression component.

```
Input -> Compress -> Decompress -> Output
```

Input and output should be the same.

You can test this with:

```js
const { GeneratorReadStream, GeneratorWriteStream } = require('stream-gen');
const zlib = require('zlib');

// Data generator - creates 100MB of data
function* gen() {
	for (let i = 0; i < 100 * 1024 * 1024; i++) {
		yield i % 256;
	}
}

// Create producer and checker
const producer = new GeneratorReadStream( gen ),
const checker = new GeneratorWriteStream( gen, function(err) {
  if (err) throw err;
  console.log('It works!');
} );

// Create compressor and decompressor
const compressor = zlib.createDeflate();
const decompressor = zlib.createInflate();

// Pipe them all together
producer.pipe(compressor).pipe(decompressor).pipe(checker);
```

The callback on `checker` tells us if data after compression and decompression is the same at it started off as.

There we go! We tested ZLIB on 100MB of data, using hardly any memory and no disc access.

### Options

#### GeneratorReadStream

Options `highWaterMark` and `encoding` are passed to Node's `Readable` Stream constructor.

`maxSize` option determines largest size chunk stream will emit.

#### GeneratorWriteStream

Options `highWaterMark` and `emitClose` are passed to Node's `Writable` Stream constructor.

## Tests

Use `npm test` to run the tests. Use `npm run cover` to check coverage.

## Changelog

See [changelog.md](https://github.com/overlookmotel/stream-gen/blob/master/changelog.md)

## Issues

If you discover a bug, please raise an issue on Github. https://github.com/overlookmotel/stream-gen/issues

## Contribution

Pull requests are very welcome. Please:

* ensure all tests pass before submitting PR
* add an entry to changelog
* add tests for new features
* document new functionality/API additions in README
