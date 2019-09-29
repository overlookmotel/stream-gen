/* --------------------
 * stream-gen module
 * Tests for write stream
 * ------------------*/

/* eslint-disable jest/no-test-callback */

'use strict';

// Modules
const {Writable} = require('stream'),
	{GeneratorWriteStream} = require('../index');

// Tests

const LENGTH = 26;
function* gen() {
	for (let i = 65; i < 65 + LENGTH; i++) {
		yield i;
	}
}

describe('GeneratorWriteStream', () => { // eslint-disable-line jest/lowercase-name
	it('is subclass of Writable Stream', () => {
		const s = new GeneratorWriteStream(gen);
		expect(s).toBeInstanceOf(Writable);
	});

	// eslint-disable-next-line jest/expect-expect
	it('calls back with no error if streamed data correct', (cb) => {
		const s = new GeneratorWriteStream(gen, cb);

		s.write('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
		s.end();
	});

	it('calls back with error if streamed data too short', (cb) => {
		const str = 'ABCDEFGHIJKLMNOPQRSTUVWXY';

		const s = new GeneratorWriteStream(gen, (err) => {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toBe(`Not enough data - ended prematurely at ${str.length}`);
			cb();
		});

		s.write(str);
		s.end();
	});

	it('calls back with error if streamed data too long', (cb) => {
		const str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ-';

		const s = new GeneratorWriteStream(gen, (err) => {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toBe(`Too much data - expected ${LENGTH}, got at least ${str.length}`);
			cb();
		});

		s.write(str);
		s.end();
	});

	it('calls back with error if streamed data different', (cb) => {
		const str = 'ABCDEFGHIJKL-NOPQRSTUVWXYZ';

		const s = new GeneratorWriteStream(gen, (err) => {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toMatch(/^Wrong data - differed in byte range \d+-\d+$/);
			cb();
		});

		s.write(str);
		s.end();
	});
});
