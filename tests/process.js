'use strict';

const PATH = require('path');
const STREAM = require('stream');
const VinylFile = require('vinyl');
const through = require('through2');

const {describe, it} = require('mocha');
const {expect} = require('chai');

const md = require('../lib/process');

function test(file, options, testerFunction) {
    const stream = new STREAM.Readable({objectMode: true});

    stream._read = function() {
        this.push(file);
        this.push(null);
    };

    const testStream = through.obj(function(file, enc, callback) {
        let error = null;
        let result;

        try {
            testerFunction(file);
        } catch (err) {
            error = err
        } finally {
            callback(error, result);
        }
    });

    stream.pipe(md(options)).pipe(testStream);
}

const SIMPLE = new VinylFile({
    path: 'test/simple.md',
    contents: Buffer.from('# Heading')
});
const SIMPLE_TARGET_PATH = PATH.normalize('test/simple.html');

context('--md-process--', function() {
    describe('Exports a default function', function() {
        it('that returns a Stream', function() {
            expect(md).to.be.a('function');
            expect(md()).to.be.instanceOf(STREAM);
        });
    });

    context('Given a non-empty Vinyl file', function() {
        describe('with simple Markdown contents', function() {
            it('returns Vinyl file with corresponding HTML buffer', function(done) {
                test(SIMPLE, {}, (file) => {
                    expect(file.isDirectory()).to.be.false;
                    expect(file.isBuffer()).to.be.true;

                    const {path, contents} = file;
                    expect(path).to.equal(SIMPLE_TARGET_PATH);
                    done();
                });
            });
        });
    });
});
