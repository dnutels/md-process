'use strict';

const PATH = require('path');
const STREAM = require('stream');
const VinylFile = require('vinyl');
const through = require('through2');

const {describe, it} = require('mocha');
const {expect} = require('chai');

const md = require('../lib/process');

const EMPTY = new VinylFile({
    path: 'test/empty.md',
    content: ''
});
const EMPTY_TARGET_PATH = PATH.normalize('test/empty.html');

const SIMPLE_TEXT = '# Heading';
const SIMPLE = new VinylFile({
    path: 'test/simple.md',
    contents: Buffer.from(SIMPLE_TEXT)
});
const SIMPLE_TARGET_PATH = PATH.normalize('test/simple.html');

context('--md-process--', function() {
    describe('Exports a default function', function() {
        it('that returns a Stream', function() {
            expect(md).to.be.a('function');
            expect(md()).to.be.instanceOf(STREAM);
        });
    });

    describe('Given an empty Vinyl file', function() {
        it('it is skipped', function(done) {
            const stream = new STREAM.Readable({objectMode: true});
            stream._read = function() {
                this.push(EMPTY);
                this.push(null);
            };
            console.log(1);

            stream.pipe(md());
            stream.on('data', (file) => {
                expect(file.isDirectory()).to.be.false;
                expect(file.isBuffer()).to.be.false;

                const {path, contents} = file;

                expect(path).to.equal(EMPTY_TARGET_PATH);
                expect(contents.toString()).to.equal('');
            });
            stream.on('end', () => {
                console.log();
                done();
            });
        });
    });
});
