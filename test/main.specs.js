/* eslint no-unused-expressions: 0 */
import FS from 'fs';

import {expect} from 'chai';
// import md from '../lib/process';
import VFS from 'vinyl-fs';
import through from 'through2';
import yamlFM from 'front-matter';

const fm = through.obj(function(file, enc, done) {
    if (file.isNull() || file.isStream()) {
        return done(null, file);
    }            

    const fileContent = file.contents.toString();
    const meta = yamlFM(fileContent);

    this.push(file);
    done();
});

const md = through.obj(function(file, enc, done) {
    if (file.isNull() || file.isStream()) {
        return done(null, file);
    }            

    const fileContent = file.contents.toString();
    console.log(typeof fileContent);
    const content = fileContent.replace(/---(.|\n)*?---/, '');
    console.log(content);

    this.push(file);
    done();
});

describe('md-process', function() {
    context('can receive', function() {
        it('markdown file stream', function() {
            VFS.src('./test/data/test.md')
                .pipe(fm)
                .pipe(md);
        });
    });
});
