/* eslint no-unused-expressions: 0 */
import PATH from 'path';
import FS from 'fs';
import STREAM from 'stream';
import VFile from 'vinyl';
import through from 'through2';

import {expect} from 'chai';

import md, {processDiscrete} from '../lib/process';

const producer = function(options) {
    const stream = new STREAM.Readable({objectMode: true});

    stream._read = function() {
        this.push(new VFile(options));
        this.push(null);
    };

    return stream;
};

const tester = function(test) {
    return through.obj(function(file, enc, done) {    
        test(file);
        done();
    });  
};

// Defined here to avoid incorrect indentation. Do not move.
const metaExample = `---
title: single-line title
layout: article
tags: [tag1, tag2, tag3]
---
`;

const emptyMetaExample = '';

const simpleExample = `# Heading
`;

const simpleResult = `<h1 id="heading">Heading</h1>
`;

describe('md-process', function() {
    context('when imported as default', function() {        
        it('is a function that returns a Stream', function() {
            expect(md).to.be.a('function');
            expect(md()).to.be.instanceOf(STREAM);
        });
        
        context('and given a Vinyl file', function() {
            it('which is empty - throws an error', function() {
                producer({})
                    .pipe(md())
                    .pipe(tester(({meta, file}) => {
                        const parts = PATH.parse(file.path);
                        expect(parts).to.eql({ 
                            root: '',
                            dir: 'test',
                            base: 'test.html',
                            ext: '.html',
                            name: 'test' 
                        });
                        done();
                    }));
            });

            it('with relative path - returns Vinyl HTML file with correct corresponding path', function(done) {
                producer({path: 'test/test', contents: new Buffer('')})
                    .pipe(md())
                    .pipe(tester(({meta, file}) => {
                        const parts = PATH.parse(file.path);
                        expect(parts).to.eql({ 
                            root: '',
                            dir: 'test',
                            base: 'test.html',
                            ext: '.html',
                            name: 'test' 
                        });
                        done();
                    }));
            });
        });

        context('and given a file with non-empty YAML Front Matter', function() {
            it('returns correct meta-information', function(done) {
                producer({path: 'test/test', contents: new Buffer(metaExample)})
                    .pipe(md())
                    .pipe(tester(({meta}) => {
                        expect(meta).to.eql({
                            title: 'single-line title',
                            layout: 'article',
                            tags: ['tag1', 'tag2', 'tag3']
                        });
                        done();
                    }));
            });
        });

        context('and given a file with empty YAML Front Matter', function() {
            it('returns empty meta-information', function(done) {
                producer({path: 'test/test', contents: new Buffer(emptyMetaExample)})
                    .pipe(md())
                    .pipe(tester(({meta}) => {
                        expect(meta).to.eql({});
                        done();
                    }));
            });
        });

        context('and given a Vinyl with simple Markdown contents', function() {
            it('returns Vinyl file with corresponding HTML content', function(done) {
                producer({path: 'test/test', contents: new Buffer(simpleExample)})
                    .pipe(md())
                    .pipe(tester(({meta, file}) => {
                        expect(file.contents.toString()).to.equal(simpleResult);
                        done();
                    }));
            });
        });
    });

    context('when imported as "processDiscrete"', function() {        
        it('is a function that returns a Stream', function() {
            expect(processDiscrete).to.be.a('function');
        });
    });

});