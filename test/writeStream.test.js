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

const LENGTH = 24;

describe('GeneratorWriteStream', () => { // eslint-disable-line jest/lowercase-name
	it('is subclass of Writable Stream', () => {
		const s = new GeneratorWriteStream(gen1byte);
		expect(s).toBeInstanceOf(Writable);
	});

	/* eslint-disable jest/expect-expect */
	describe('calls back with no error if streamed data correct', () => {
		describe('in single chunk', () => {
			it('with default options.byte', (cb) => {
				const s = new GeneratorWriteStream(gen1byte, cb);

				s.write('ABCDEFGHIJKLMNOPQRSTUVWX');
				s.end();
			});

			it('with options.byte = 2', (cb) => {
				const s = new GeneratorWriteStream(gen2bytes, {bytes: 2}, cb);

				s.write('ABCDEFGHIJKLMNOPQRSTUVWX');
				s.end();
			});

			it('with options.byte = 4', (cb) => {
				const s = new GeneratorWriteStream(gen4bytes, {bytes: 4}, cb);

				s.write('ABCDEFGHIJKLMNOPQRSTUVWX');
				s.end();
			});
		});

		describe('in multiple chunks', () => {
			describe('when chunk boundary falls on byte boundary', () => {
				it('with default options.byte', (cb) => {
					const s = new GeneratorWriteStream(gen1byte, cb);

					s.write('ABCDEFGHIJKL');
					s.write('MNOPQRSTUVWX');
					s.end();
				});

				it('with options.byte = 2', (cb) => {
					const s = new GeneratorWriteStream(gen2bytes, {bytes: 2}, cb);

					s.write('ABCDEFGHIJKL');
					s.write('MNOPQRSTUVWX');
					s.end();
				});

				it('with options.byte = 4', (cb) => {
					const s = new GeneratorWriteStream(gen4bytes, {bytes: 4}, cb);

					s.write('ABCDEFGHIJKL');
					s.write('MNOPQRSTUVWX');
					s.end();
				});
			});

			describe('when chunk boundary does not fall on byte boundary', () => {
				it('with options.byte = 2', (cb) => {
					const s = new GeneratorWriteStream(gen2bytes, {bytes: 2}, cb);

					s.write('ABCDEFGHIJK');
					s.write('LMNOPQRSTUV');
					s.write('WX');
					s.end();
				});

				it('with options.byte = 4', (cb) => {
					const s = new GeneratorWriteStream(gen4bytes, {bytes: 4}, cb);

					s.write('ABCDEFGHIJK');
					s.write('LMNOPQRSTUV');
					s.write('WX');
					s.end();
				});
			});
		});
	});
	/* eslint-enable jest/expect-expect */

	it('calls back with error if streamed data too short', (cb) => {
		const str = 'ABCDEFGHIJKLMNOPQRSTUVW';

		const s = new GeneratorWriteStream(gen1byte, (err) => {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toBe(`Not enough data - ended prematurely at ${str.length}`);
			cb();
		});

		s.write(str);
		s.end();
	});

	it('calls back with error if streamed data too long', (cb) => {
		const str = 'ABCDEFGHIJKLMNOPQRSTUVWXY';

		const s = new GeneratorWriteStream(gen1byte, (err) => {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toBe(`Too much data - expected ${LENGTH}, got at least ${str.length}`);
			cb();
		});

		s.write(str);
		s.end();
	});

	it('calls back with error if streamed data different', (cb) => {
		const str = 'ABCDEFGHIJKL-NOPQRSTUVWX';

		const s = new GeneratorWriteStream(gen1byte, (err) => {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toMatch(/^Wrong data - differed in byte range \d+-\d+$/);
			cb();
		});

		s.write(str);
		s.end();
	});
});

/*
 * Generators
 */
function* gen1byte() {
	for (let i = 65; i < 65 + LENGTH; i++) {
		yield i;
	}
}

function* gen2bytes() {
	for (let i = 65; i < 65 + LENGTH; i += 2) {
		yield i + (i + 1) * 256;
	}
}

function* gen4bytes() {
	for (let i = 65; i < 65 + LENGTH; i += 4) {
		yield i + (i + 1) * 256 + (i + 2) * 256 * 256 + (i + 3) * 256 * 256 * 256;
	}
}
