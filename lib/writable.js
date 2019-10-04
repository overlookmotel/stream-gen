/* --------------------
 * stream-gen module
 * Writable stream
 * ------------------*/

'use strict';

// Modules
const {Writable} = require('stream');

// Imports
const {bufferFromIterator} = require('./shared'),
	{ITERATOR, CALLBACK, BYTES_READ, ERRORED} = require('./symbols');

// Exports

/*
 * `GeneratorWriteStream` class
 * Writable stream that compares to result of a generator
 */
module.exports = class GeneratorWriteStream extends Writable {
	constructor(gen, options, cb) {
		// Conform options
		const streamOptions = {};
		if (typeof options === 'function') {
			cb = options;
			options = {};
		} else {
			options = {...options};
			for (const opt of ['highWaterMark', 'emitClose']) {
				if (options[opt] != null) streamOptions[opt] = options[opt];
			}
		}

		// Call super constructor
		super(streamOptions);

		// Save callback
		this[CALLBACK] = cb;

		// Create iterator from generator
		this[ITERATOR] = gen(options);

		// Init
		this[ERRORED] = false;
		this[BYTES_READ] = 0;
	}

	_write(chunk, encoding, cb) { // eslint-disable-line consistent-return
		if (chunk.length === 0) return cb();

		// If already errored, exit
		if (this[ERRORED]) return cb();

		// Get buffer from iterator
		const {buffer} = bufferFromIterator(this[ITERATOR], chunk.length);

		this[BYTES_READ] += buffer.length;

		// Check is as expected
		if (buffer.length !== chunk.length) {
			// Stream continued after expected
			mismatch(this, `Too much data - expected ${this[BYTES_READ]}, got at least ${this[BYTES_READ] + chunk.length - buffer.length}`);
		} else if (Buffer.compare(buffer, chunk) !== 0) {
			// Stream contains wrong data
			mismatch(this, `Wrong data - differed in byte range ${this[BYTES_READ] - buffer.length}-${this[BYTES_READ] - 1}`);
		}

		cb();
	}

	_final(cb) { // eslint-disable-line consistent-return
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
	}

	_destroy(err, cb) {
		// Clean up
		this[CALLBACK] = undefined;
		this[ITERATOR] = undefined;
		this[ERRORED] = undefined;
		this[BYTES_READ] = undefined;

		cb();
	}
};

function mismatch(stream, message) {
	stream[ERRORED] = true;
	stream[CALLBACK](new Error(message));
}
