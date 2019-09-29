/* --------------------
 * stream-gen module
 * Entry point
 * ------------------*/

'use strict';

// Imports
const GeneratorReadStream = require('./readable'),
	GeneratorWriteStream = require('./writable');

// Exports

module.exports = {
	GeneratorReadStream,
	GeneratorWriteStream
};
