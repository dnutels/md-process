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

const EMPTY = new VinylFile({
    path: 'test/empty.md'
});
const EMPTY_TARGET_PATH = PATH.normalize('test/empty.html');

const SIMPLE_TEXT = `---
title: Server-side Rendering with React, Node and Express
tags: [react, ssr, node, express]
---

# Universal Web Applications with React, Node and Express

**Web applications are everywhere.**

There is no official definition, but we've made the distinction: *web applications* are highly interactive, dynamic and performant, while *web sites* are informational and less transient. This **very rough** categorization provides us with a starting point, from which to apply development and design patterns.

## Example in Perl

\`\`\`perl
#!/usr/local/bin/perl
print "Content-type: text/html\n\n";
print "<html>\n";
print "<head><title>Perl - Hello, world!</title></head>\n";
print "<body>\n";
print "<h1>Hello, world!</h1>\n";
print "</body>\n";
print "</html>\n";
\`\`\`
`;

const SIMPLE = new VinylFile({
    path: 'test/simple.md',
    contents: Buffer.from(SIMPLE_TEXT)
});
const SIMPLE_TARGET_PATH = PATH.normalize('test/simple.html');

context('--md-process--', function() {
    xdescribe('Exports a default function', function() {
        it('that returns a Stream', function() {
            expect(md).to.be.a('function');
            expect(md()).to.be.instanceOf(STREAM);
        });
    });

    xdescribe('Given an empty Vinyl file', function() {
        it('', function() {
            test(EMPTY, {}, (file) => {
                expect(file.isDirectory()).to.be.false;
                expect(file.isBuffer()).to.be.true;

                const {path, contents} = file;
                expect(path).to.equal(EMPTY_TARGET_PATH);
                expect(contents.toString()).to.equal('');
                done();
            });
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
                    expect(contents.toString()).to.equal('<h1 id="heading">Heading</h1>\n');
                    done();
                });
            });
        });
    });
});
