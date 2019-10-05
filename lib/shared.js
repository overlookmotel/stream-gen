/* --------------------
 * stream-gen module
 * Shared functions
 * ------------------*/

'use strict';

// Exports

module.exports = {
	bufferFromIterator,
	getBytesOption
};

/**
 * `bufferFromIterator`
 * Get values from iterator and fill into buffer
 * @param {Iterator} iterator - Iterator to iterate over
 * @param {number} size - Number of bytes to read
 * @param {number} bytes - Number of bytes in numbers returned from generator
 * @param {Buffer|null} overflow - Overflow buffer from last iteration, or `null` if none
 * @returns {Object}
 * @returns {Buffer} .buffer - Buffer
 * @returns {Buffer|null} .overflow - Overflow buffer or `null` if none
 * @returns {boolean} .ended - `true` if iterator ended, `false` if not
 */
function bufferFromIterator(iterator, size, bytes, overflow) {
	// Create buffer (make size multiple of `bytes`)
	const overflowSize = overflow ? overflow.length : 0;
	let bufferSize = Math.ceil((size - overflowSize) / bytes) * bytes + overflowSize;
	let buffer = Buffer.allocUnsafe(bufferSize);

	// Insert overflow into buffer
	let index = overflowSize;
	if (overflow) {
		if (overflowSize >= size) {
			// Overflow is longer than size of buffer - put whole of overflow in buffer
			buffer = overflow;
			bufferSize = overflowSize;
		} else {
			// Copy overflow into start of buffer
			overflow.copy(buffer);
		}

		// Clear overflow
		overflow = null;
	}

	// Write bytes from iterator into buffer
	for (; index < size; index += bytes) {
		const {value, done} = iterator.next();

		if (done) {
			// Iterator finished - truncate buffer
			buffer = buffer.slice(0, index);
			return {buffer, overflow: null, ended: true};
		}

		// Write
		if (bytes === 1) {
			buffer[index] = value;
		} else if (bytes === 2) {
			buffer.writeUInt16LE(value, index);
		} else if (bytes === 4) {
			buffer.writeUInt32LE(value, index);
		}
	}

	// Separate off overflow
	if (bufferSize !== size) {
		overflow = buffer.slice(size);
		buffer = buffer.slice(0, size);
	}

	// Return buffer and overflow
	return {buffer, overflow, ended: false};
}

function getBytesOption(options) {
	const {bytes} = options;
	if (bytes == null) return 1;
	if (![1, 2, 4].includes(bytes)) throw new Error('options.bytes must be 1, 2 or 4');
	return bytes;
}
