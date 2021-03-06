/* --------------------
 * stream-gen module
 * Readable stream
 * ------------------*/

'use strict';

// Modules
const {Readable} = require('stream');

// Imports
const {bufferFromIterator, getStreamOptions, getBytesOption} = require('./shared'),
	{ITERATOR, BYTES, MAX_SIZE, OVERFLOW, READING} = require('./symbols');

// Exports

/**
 * `GeneratorReadStream` class
 * Readable stream created from a generator
 * @param {Function} gen - Generator function
 * @param {Object} [options] - Options
 * @param {number} [options.highWaterMark] - Passed to Readable constructor
 * @param {string} [options.encoding] - Passed to Readable constructor
 * @param {number} [options.bytes=1] - Number of bytes in generator values
 * @param {number} [options.maxSize] - Maximum size of chunks to emit
 */
module.exports = class GeneratorReadStream extends Readable {
	constructor(gen, options) {
		// Call super constructor
		if (!options) options = {};
		super(getStreamOptions(options));

		// Save options
		this[BYTES] = getBytesOption(options);
		this[MAX_SIZE] = options.maxSize;

		// Create iterator from generator
		this[ITERATOR] = gen(options);
		this[OVERFLOW] = null;

		// Init
		this[READING] = false;
	}

	_read(size) {
		// If already reading, exit.
		// This shouldn't happen according to Node.js streams docs, but it seems to
		// sometimes with Node 8.
		if (this[READING]) return;
		this[READING] = true;

		// Work out size of chunk to emit
		const maxSize = this[MAX_SIZE];
		if (maxSize && maxSize < size) size = maxSize;

		// Iterate through iterator
		const iterator = this[ITERATOR];
		let wantsMore = true,
			ended = false,
			overflow = this[OVERFLOW];
		while (wantsMore && !ended) {
			// Fill buffer from generator
			let buffer;
			({buffer, overflow, ended} = bufferFromIterator(iterator, size, this[BYTES], overflow));

			if (buffer.length > 0) wantsMore = this.push(buffer);
		}

		if (ended) this.push(null);

		this[OVERFLOW] = overflow;
		this[READING] = false;
	}

	_destroy(err, cb) {
		// Clean up
		this[BYTES] = undefined;
		this[MAX_SIZE] = undefined;
		this[ITERATOR] = undefined;
		this[OVERFLOW] = undefined;
		this[READING] = undefined;

		cb();
	}
};
