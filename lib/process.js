'use strict';

const PATH = require('path');

const promisify = require('util.promisify');
const through = require('through2');
const marked = promisify(require('marked'));

const fm = require('front-matter');
const VFile = require('vinyl');

const createTargetFile = function(path, contents, {ext = 'html'} = {}) {
    const {dir, name} = PATH.parse(path);
    const targetPath = PATH.normalize(`${dir}/${name}.${ext}`);

    const file = new VFile({
        path: targetPath,
        contents: Buffer.from(contents)
    });

    return file;
};


async function processMarkdown({path, contents}, options) {
    const stringContent = contents.toString();
    const meta = fm(stringContent);
    const html = await marked(stringContent);    

    return {html, meta};
}

function md(options) {
    return through.obj(async function(file, enc, callback) {
        if (file.isNull() || file.isStream()) {
            callback(null, file);
        }            
        
        const {path} = file;
        let error = null;
        let result;
        
        try {
            const {html, meta} = await processMarkdown(file, options);    
            result = createTargetFile(path, html, options);   
        } catch (err) {
            error = err
        } finally {
            callback(error, result);
        }
    }); 
}

module.exports = md;