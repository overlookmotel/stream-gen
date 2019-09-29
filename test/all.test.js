/* --------------------
 * stream-gen module
 * Tests
 * ------------------*/

/* eslint-disable jest/no-test-callback */

'use strict';

// Modules
const {Readable, Writable, PassThrough} = require('stream'),
	zlib = require('zlib'),
	streamGen = require('../index');

// Tests

const {GeneratorReadStream, GeneratorWriteStream} = streamGen;

const LENGTH = 26;
function* genLetters() {
	for (let i = 65; i < 65 + LENGTH; i++) {
		yield i;
	}
}

describe('GeneratorReadStream', () => { // eslint-disable-line jest/lowercase-name
	it('is subclass of Readable Stream', () => {
		const s = new GeneratorReadStream(genLetters);
		expect(s).toBeInstanceOf(Readable);
	});

	it('produces expected data', () => {
		const s = new GeneratorReadStream(genLetters);

		let res = s.read();
		expect(res.toString()).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
		res = s.read();
		expect(res).toBeNull();
	});
});

describe('GeneratorWriteStream', () => { // eslint-disable-line jest/lowercase-name
	it('is subclass of Writable Stream', () => {
		const s = new GeneratorWriteStream(genLetters);
		expect(s).toBeInstanceOf(Writable);
	});

	// eslint-disable-next-line jest/expect-expect
	it('calls back with no error if streamed data correct', (cb) => {
		const s = new GeneratorWriteStream(genLetters, cb);

		s.write('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
		s.end();
	});

	it('calls back with error if streamed data too short', (cb) => {
		const str = 'ABCDEFGHIJKLMNOPQRSTUVWXY';

		const s = new GeneratorWriteStream(genLetters, (err) => {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toBe(`Not enough data - ended prematurely at ${str.length}`);
			cb();
		});

		s.write(str);
		s.end();
	});

	it('calls back with error if streamed data too long', (cb) => {
		const str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ-';

		const s = new GeneratorWriteStream(genLetters, (err) => {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toBe(`Too much data - expected ${LENGTH}, got at least ${str.length}`);
			cb();
		});

		s.write(str);
		s.end();
	});

	it('calls back with error if streamed data different', (cb) => {
		const str = 'ABCDEFGHIJKL-NOPQRSTUVWXYZ';

		const s = new GeneratorWriteStream(genLetters, (err) => {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toMatch(/^Wrong data - differed in byte range \d+-\d+$/);
			cb();
		});

		s.write(str);
		s.end();
	});
});

describe('piped', () => {
	describe('with short data', () => {
		runPipeTests(genLetters);
	});

	describe('with 1KB data', () => {
		function* gen() {
			for (let i = 0; i < 1000; i++) {
				yield i % 256;
			}
		}

		runPipeTests(gen);
	});

	describe('with 1MB data', () => {
		function* gen() {
			for (let i = 0; i < 1000 * 1000; i++) {
				yield i % 256;
			}
		}

		runPipeTests(gen);
	});

	describe('with 10MB data', () => {
		function* gen() {
			for (let i = 0; i < 10 * 1000 * 1000; i++) {
				yield i % 256;
			}
		}

		runPipeTests(gen);
	});

	describe('with 10MB data handcoded generator', () => {
		function gen() {
			let i = 0;
			return {
				next() {
					if (i === 10 * 1000 * 1000) return {value: undefined, done: true};
					return {value: i++ % 256, done: false};
				}
			};
		}

		runPipeTests(gen);
	});
});

function runPipeTests(gen) {
	// eslint-disable-next-line jest/expect-expect
	it('calls back with no error when piped directly', (cb) => {
		const producer = new GeneratorReadStream(gen),
			checker = new GeneratorWriteStream(gen, cb);

		producer.pipe(checker);
	});

	// eslint-disable-next-line jest/expect-expect
	it('calls back with no error when piped via passthrough', (cb) => {
		const producer = new GeneratorReadStream(gen),
			checker = new GeneratorWriteStream(gen, cb);

		const passthrough = new PassThrough();

		producer.pipe(passthrough).pipe(checker);
	});

	// eslint-disable-next-line jest/expect-expect
	it('calls back with no error when piped via zlib', (cb) => {
		const producer = new GeneratorReadStream(gen),
			checker = new GeneratorWriteStream(gen, cb);

		const deflate = zlib.createDeflate(),
			inflate = zlib.createInflate();

		producer.pipe(deflate).pipe(inflate).pipe(checker);
	});
}
