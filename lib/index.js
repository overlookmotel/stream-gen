/* --------------------
 * stream-gen module
 * ------------------*/

'use strict';

// Modules
const {Readable, Writable} = require('stream'),
	{inherits} = require('util');

// Symbols
const ITERATOR = Symbol('stream-gen.ITERATOR'),
	OPTIONS = Symbol('stream-gen.OPTIONS'),
	CALLBACK = Symbol('stream-gen.CALLBACK'),
	READING = Symbol('stream-gen.READING'),
	BYTES_READ = Symbol('stream-gen.BYTES_READ'),
	ERRORED = Symbol('stream-gen.ERRORED');

// Exports
module.exports = {
	GeneratorReadStream,
	GeneratorWriteStream
};

/**
 * `GeneratorReadStream` class
 * Readable stream created from a generator
 * @param {Function} gen - Generator function
 * @param {Object} [options] - Options
 * @param {number} [options.highWaterMark] - Passed to Readable constructor
 * @param {string} [options.encoding] - Passed to Readable constructor
 * @param {number} [options.maxSize] - Maximum size of chunks to emit
 */
function GeneratorReadStream(gen, options) {
	// Call super constructor
	options = Object.assign({}, options);
	const streamOptions = {};
	for (let opt of ['highWaterMark', 'encoding']) {
		if (options[opt] != null) streamOptions[opt] = options[opt];
	}

	Readable.call(this, streamOptions);

	// Save options
	this[OPTIONS] = options;

	// Create iterator from generator
	this[ITERATOR] = gen(options);

	// Init
	this[READING] = false;
}

inherits(GeneratorReadStream, Readable);

GeneratorReadStream.prototype._read = function(size) {
	// If already reading, exit
	// This shouldn't happen according to Node.js streams docs, but it seems to
	// sometimes with Node 6 and 8.
	if (this[READING]) return;
	this[READING] = true;

	// Work out size of chunk to emit
	const {maxSize} = this[OPTIONS];
	if (maxSize && maxSize < size) size = maxSize;

	// Iterate through iterator
	const iterator = this[ITERATOR];
	let wantsMore = true,
		ended = false;
	while (wantsMore && !ended) {
		// Fill buffer from generator
		let buffer;
		({buffer, ended} = bufferFromIterator(iterator, size));

		if (buffer.length > 0) wantsMore = this.push(buffer);
	}

	if (ended) this.push(null);

	this[READING] = false;
};

GeneratorReadStream.prototype._destroy = function(err, cb) {
	// Clean up
	delete this[OPTIONS];
	delete this[ITERATOR];
	delete this[READING];

	cb();
};

/*
 * `GeneratorWriteStream` class
 * Writable stream that compares to result of a generator
 */
function GeneratorWriteStream(gen, options, cb) {
	// Conform options
	const streamOptions = {};
	if (typeof options == 'function') {
		cb = options;
		options = {};
	} else {
		options = Object.assign({}, options);
		for (let opt of ['highWaterMark', 'emitClose']) {
			if (options[opt] != null) streamOptions[opt] = options[opt];
		}
	}

	// Call super constructor
	Writable.call(this, streamOptions);

	// Save callback
	this[CALLBACK] = cb;

	// Create iterator from generator
	this[ITERATOR] = gen(options);

	// Init
	this[ERRORED] = false;
	this[BYTES_READ] = 0;
}

inherits(GeneratorWriteStream, Writable);

// eslint-disable-next-line consistent-return
GeneratorWriteStream.prototype._write = function(chunk, encoding, cb) {
	if (chunk.length == 0) return cb();

	// If already errored, exit
	if (this[ERRORED]) return cb();

	// Get buffer from iterator
	const {buffer} = bufferFromIterator(this[ITERATOR], chunk.length);

	this[BYTES_READ] += buffer.length;

	// Check is as expected
	if (buffer.length != chunk.length) {
		// Stream continued after expected
		mismatch(this, `Too much data - expected ${this[BYTES_READ]}, got at least ${this[BYTES_READ] + chunk.length - buffer.length}`);
	} else if (Buffer.compare(buffer, chunk) != 0) {
		// Stream contains wrong data
		mismatch(this, `Wrong data - differed in byte range ${this[BYTES_READ] - buffer.length}-${this[BYTES_READ] - 1}`);
	}

	cb();
};

GeneratorWriteStream.prototype._final = function(cb) { // eslint-disable-line consistent-return
	if (this[ERRORED]) return cb();

	// Stream is finished - check generator ended
	const {done} = this[ITERATOR].next();
	if (done) {
		// Stream and generator ended simultaeously - callback without error
		this[CALLBACK]();
	} else {
		// Stream ended prematurely
		mismatch(this, `Not enough data - ended prematurely at ${this[BYTES_READ]}`);
	}

	cb();
};

GeneratorWriteStream.prototype._destroy = function(err, cb) {
	// Clean up
	delete this[CALLBACK];
	delete this[ITERATOR];
	delete this[ERRORED];
	delete this[BYTES_READ];

	cb();
};

function mismatch(stream, message) {
	stream[ERRORED] = true;
	stream[CALLBACK](new Error(message));
}

/**
 * `bufferFromIterator`
 * Get values from iterator and fill into buffer
 * @param {Iterator} iterator - Iterator to iterate over
 * @param {number} size - Number of bytes to read
 * @returns {Object}
 * @returns {Buffer} .buffer - Buffer
 * @returns {boolean} .ended - `true` if iterator ended, `false` if not
 */
function bufferFromIterator(iterator, size) {
	let buffer = Buffer.allocUnsafe(size),
		ended = false;

	for (let i = 0; i < size; i++) {
		const {value, done} = iterator.next();

		if (done) {
			// Iterator finished - truncate buffer
			buffer = buffer.slice(0, i);
			ended = true;
			break;
		}

		buffer[i] = value;
	}

	return {buffer, ended};
}
