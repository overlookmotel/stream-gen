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
		describe('with default options.byte', () => {
			runPipeTests(function*() {
				for (let i = 65; i < 65 + 24; i++) {
					yield i;
				}
			});
		});

		describe('with options.bytes = 2', () => {
			runPipeTests(function*() {
				for (let i = 65; i < 65 + 24; i += 2) {
					yield i + (i + 1) * 256;
				}
			}, 2);
		});

		describe('with options.bytes = 4', () => {
			runPipeTests(function*() {
				for (let i = 65; i < 65 + 24; i += 4) {
					yield i + (i + 1) * 256 + (i + 2) * 256 * 256 + (i + 3) * 256 * 256 * 256;
				}
			}, 4);
		});
	});

	describe('with 1KB data', () => {
		describe('with default options.byte', () => {
			runPipeTests(function*() {
				for (let i = 0; i < 1000; i++) {
					yield i % 256;
				}
			});
		});

		describe('with options.bytes = 2', () => {
			runPipeTests(function*() {
				for (let i = 0; i < 1000; i += 2) {
					yield i % (256 * 256);
				}
			}, 2);
		});

		describe('with options.bytes = 4', () => {
			runPipeTests(function*() {
				for (let i = 0; i < 1000; i += 4) {
					yield i % (256 * 256 * 256 * 256);
				}
			}, 4);
		});
	});

	describe('with 1MB data', () => {
		describe('with default options.byte', () => {
			runPipeTests(function*() {
				for (let i = 0; i < 1000 * 1000; i++) {
					yield i % 256;
				}
			});
		});

		describe('with options.bytes = 2', () => {
			runPipeTests(function*() {
				for (let i = 0; i < 1000 * 1000; i += 2) {
					yield i % (256 * 256);
				}
			}, 2);
		});

		describe('with options.bytes = 4', () => {
			runPipeTests(function*() {
				for (let i = 0; i < 1000 * 1000; i += 4) {
					yield i % (256 * 256 * 256 * 256);
				}
			}, 4);
		});
	});

	describe('with 10MB data', () => {
		describe('with default options.byte', () => {
			runPipeTests(function*() {
				for (let i = 0; i < 10 * 1000 * 1000; i++) {
					yield i % 256;
				}
			});
		});

		describe('with options.bytes = 2', () => {
			runPipeTests(function*() {
				for (let i = 0; i < 10 * 1000 * 1000; i += 2) {
					yield i % (256 * 256);
				}
			}, 2);
		});

		describe('with options.bytes = 4', () => {
			runPipeTests(function*() {
				for (let i = 0; i < 10 * 1000 * 1000; i += 4) {
					yield i % (256 * 256 * 256 * 256);
				}
			}, 4);
		});
	});

	describe('with 10MB data handcoded generator', () => {
		describe('with default options.byte', () => {
			runPipeTests(() => {
				let i = 0;
				return {
					next() {
						if (i === 10 * 1000 * 1000) return {value: undefined, done: true};
						return {value: i++ % 256, done: false};
					}
				};
			});
		});

		describe('with options.bytes = 2', () => {
			runPipeTests(() => {
				let i = 0;
				return {
					next() {
						if (i === 10 * 1000 * 1000) return {value: undefined, done: true};
						const value = i % (256 * 256);
						i += 2;
						return {value, done: false};
					}
				};
			}, 2);
		});

		describe('with options.bytes = 4', () => {
			runPipeTests(() => {
				let i = 0;
				return {
					next() {
						if (i === 10 * 1000 * 1000) return {value: undefined, done: true};
						const value = i % (256 * 256 * 256 * 256);
						i += 4;
						return {value, done: false};
					}
				};
			}, 4);
		});
	});
});

function runPipeTests(gen, bytes) {
	/* eslint-disable jest/expect-expect */
	it('calls back with no error when piped directly', (cb) => {
		const producer = new GeneratorReadStream(gen, {bytes}),
			checker = new GeneratorWriteStream(gen, {bytes}, cb);

		producer.pipe(checker);
	});

	it('calls back with no error when piped via passthrough', (cb) => {
		const producer = new GeneratorReadStream(gen, {bytes}),
			checker = new GeneratorWriteStream(gen, {bytes}, cb);

		const passthrough = new PassThrough();

		producer.pipe(passthrough).pipe(checker);
	});

	it('calls back with no error when piped via zlib', (cb) => {
		const producer = new GeneratorReadStream(gen, {bytes}),
			checker = new GeneratorWriteStream(gen, {bytes}, cb);

		const deflate = zlib.createDeflate(),
			inflate = zlib.createInflate();

		producer.pipe(deflate).pipe(inflate).pipe(checker);
	});
	/* eslint-enable jest/expect-expect */
}
