/* --------------------
 * stream-gen module
 * Tests for read stream
 * ------------------*/

'use strict';

// Modules
const {Readable} = require('stream'),
	{GeneratorReadStream} = require('../index');

// Tests

const LENGTH = 26;
function* gen() {
	for (let i = 65; i < 65 + LENGTH; i++) {
		yield i;
	}
}

describe('GeneratorReadStream', () => { // eslint-disable-line jest/lowercase-name
	it('is subclass of Readable Stream', () => {
		const s = new GeneratorReadStream(gen);
		expect(s).toBeInstanceOf(Readable);
	});

	it('produces expected data', () => {
		const s = new GeneratorReadStream(gen);

		let res = s.read();
		expect(res.toString()).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
		res = s.read();
		expect(res).toBeNull();
	});
});
