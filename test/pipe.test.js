/* --------------------
 * stream-gen module
 * Tests for piping read stream to write stream
 * ------------------*/

/* eslint-disable jest/no-test-callback */

'use strict';

// Modules
const {PassThrough} = require('stream'),
	zlib = require('zlib'),
	{GeneratorReadStream, GeneratorWriteStream} = require('../index');

// Tests

describe('piped', () => {
	describe('with short data', () => {
		const LENGTH = 26;
		function* gen() {
			for (let i = 65; i < 65 + LENGTH; i++) {
				yield i;
			}
		}

		runPipeTests(gen);
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
