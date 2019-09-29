/* --------------------
 * stream-gen module
 * Tests
 * ------------------*/

'use strict';

// Modules
const chai = require('chai'),
	{expect} = chai,
	{Readable, Writable, PassThrough} = require('stream'),
	zlib = require('zlib'),
	streamGen = require('../lib/');

// Init
chai.config.includeStack = true;

// Tests

/* global describe, it */

const {GeneratorReadStream, GeneratorWriteStream} = streamGen;

const LENGTH = 26;
function* genLetters() {
	for (let i = 65; i < 65 + LENGTH; i++) {
		yield i;
	}
}

describe('GeneratorReadStream', () => {
	it('is subclass of Readable Stream', () => {
		const s = new GeneratorReadStream(genLetters);
		expect(s).to.be.instanceof(Readable);
	});

	it('produces expected data', () => {
		const s = new GeneratorReadStream(genLetters);

		let res = s.read();
		expect(res.toString()).to.equal('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
		res = s.read();
		expect(res).to.be.null; // eslint-disable-line no-unused-expressions
	});
});

describe('GeneratorWriteStream', () => {
	it('is subclass of Writable Stream', () => {
		const s = new GeneratorWriteStream(genLetters);
		expect(s).to.be.instanceof(Writable);
	});

	it('calls back with no error if streamed data correct', (cb) => {
		const s = new GeneratorWriteStream(genLetters, cb);

		s.write('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
		s.end();
	});

	it('calls back with error if streamed data too short', (cb) => {
		const str = 'ABCDEFGHIJKLMNOPQRSTUVWXY';

		const s = new GeneratorWriteStream(genLetters, (err) => {
			expect(err).to.be.instanceof(Error);
			expect(err.message).to.equal(`Not enough data - ended prematurely at ${str.length}`);
			cb();
		});

		s.write(str);
		s.end();
	});

	it('calls back with error if streamed data too long', (cb) => {
		const str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ-';

		const s = new GeneratorWriteStream(genLetters, (err) => {
			expect(err).to.be.instanceof(Error);
			expect(err.message).to.equal(`Too much data - expected ${LENGTH}, got at least ${str.length}`);
			cb();
		});

		s.write(str);
		s.end();
	});

	it('calls back with error if streamed data different', (cb) => {
		const str = 'ABCDEFGHIJKL-NOPQRSTUVWXYZ';

		const s = new GeneratorWriteStream(genLetters, (err) => {
			expect(err).to.be.instanceof(Error);
			expect(err.message).to.match(/^Wrong data - differed in byte range \d+-\d+$/);
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
});

function runPipeTests(gen) {
	it('calls back with no error when piped directly', (cb) => {
		const producer = new GeneratorReadStream(gen),
			checker = new GeneratorWriteStream(gen, cb);

		producer.pipe(checker);
	});

	it('calls back with no error when piped via passthrough', (cb) => {
		const producer = new GeneratorReadStream(gen),
			checker = new GeneratorWriteStream(gen, cb);

		const passthrough = new PassThrough();

		producer.pipe(passthrough).pipe(checker);
	});

	it('calls back with no error when piped via zlib', (cb) => {
		const producer = new GeneratorReadStream(gen),
			checker = new GeneratorWriteStream(gen, cb);

		const deflate = zlib.createDeflate(),
			inflate = zlib.createInflate();

		producer.pipe(deflate).pipe(inflate).pipe(checker);
	});
}
