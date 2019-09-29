/* --------------------
 * stream-gen module
 * Shared functions
 * ------------------*/

'use strict';

// Exports

module.exports = {bufferFromIterator};

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
