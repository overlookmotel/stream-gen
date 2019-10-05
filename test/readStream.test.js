/* --------------------
 * stream-gen module
 * Tests for read stream
 * ------------------*/

'use strict';

// Modules
const {Readable} = require('stream'),
	{GeneratorReadStream} = require('../index');

// Tests

const LENGTH = 24;

describe('GeneratorReadStream', () => { // eslint-disable-line jest/lowercase-name
	it('is subclass of Readable Stream', () => {
		const s = new GeneratorReadStream(gen1byte);
		expect(s).toBeInstanceOf(Readable);
	});

	describe('produces expected data', () => {
		describe('in single chunk', () => {
			it('with default options.bytes', () => {
				const s = new GeneratorReadStream(gen1byte);

				let res = s.read();
				expect(res.toString()).toBe('ABCDEFGHIJKLMNOPQRSTUVWX');
				res = s.read();
				expect(res).toBeNull();
			});

			it('with options.bytes = 2', () => {
				const s = new GeneratorReadStream(gen2bytes, {bytes: 2});

				let res = s.read();
				expect(res.toString()).toBe('ABCDEFGHIJKLMNOPQRSTUVWX');
				res = s.read();
				expect(res).toBeNull();
			});

			it('with options.bytes = 4', () => {
				const s = new GeneratorReadStream(gen4bytes, {bytes: 4});

				let res = s.read();
				expect(res.toString()).toBe('ABCDEFGHIJKLMNOPQRSTUVWX');
				res = s.read();
				expect(res).toBeNull();
			});
		});

		describe('in multiple chunks', () => {
			describe('when chunk boundary falls on byte boundary', () => {
				it('with default options.bytes', () => {
					const s = new GeneratorReadStream(gen1byte);

					let res = s.read(12);
					expect(res.toString()).toBe('ABCDEFGHIJKL');
					res = s.read(12);
					expect(res.toString()).toBe('MNOPQRSTUVWX');
					res = s.read();
					expect(res).toBeNull();
				});

				it('with options.bytes = 2', () => {
					const s = new GeneratorReadStream(gen2bytes, {bytes: 2});

					let res = s.read(12);
					expect(res.toString()).toBe('ABCDEFGHIJKL');
					res = s.read(12);
					expect(res.toString()).toBe('MNOPQRSTUVWX');
					res = s.read();
					expect(res).toBeNull();
				});

				it('with options.bytes = 4', () => {
					const s = new GeneratorReadStream(gen4bytes, {bytes: 4});

					let res = s.read(12);
					expect(res.toString()).toBe('ABCDEFGHIJKL');
					res = s.read(12);
					expect(res.toString()).toBe('MNOPQRSTUVWX');
					res = s.read();
					expect(res).toBeNull();
				});
			});

			describe('when chunk boundary does not fall on byte boundary', () => {
				it('with options.bytes = 2', () => {
					const s = new GeneratorReadStream(gen2bytes, {bytes: 2});

					let res = s.read(11);
					expect(res.toString()).toBe('ABCDEFGHIJK');
					res = s.read(11);
					expect(res.toString()).toBe('LMNOPQRSTUV');
					res = s.read(2);
					expect(res.toString()).toBe('WX');
					res = s.read();
					expect(res).toBeNull();
				});

				it('with options.bytes = 4', () => {
					const s = new GeneratorReadStream(gen4bytes, {bytes: 4});

					let res = s.read(11);
					expect(res.toString()).toBe('ABCDEFGHIJK');
					res = s.read(11);
					expect(res.toString()).toBe('LMNOPQRSTUV');
					res = s.read(2);
					expect(res.toString()).toBe('WX');
					res = s.read();
					expect(res).toBeNull();
				});
			});
		});
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
