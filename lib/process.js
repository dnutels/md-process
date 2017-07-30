'use strict';

const PATH = require('path');

const promisify = require('util.promisify');
const through = require('through2');
const marked = promisify(require('marked'));
const Renderer = require('./renderer');

const fm = require('front-matter');
const VFile = require('vinyl');

const createTargetFile = function({path, contents = ''}, {ext = 'html'} = {}) {
    const {dir, name} = PATH.parse(path);
    const targetPath = PATH.normalize(`${dir}/${name}.${ext}`);

    const file = new VFile({
        path: targetPath,
        contents: Buffer.from(contents)
    });

    return file;
};

function processFrontMatter({path, contents}) {
    const stringContents = contents.toString();
    const {attributes, body} = fm(stringContents);
    const augmentedAttributes = Object.assign({}, attributes, {path});

    return {attributes: augmentedAttributes, body};
}

async function processMarkdown({path, contents}, {renderer}) {
    return await marked(contents, {renderer});
}

function md(options) {
    const renderer = new Renderer();

    return through.obj(async function(file, enc, callback) {
        if (file.isNull() || file.isStream()) {
            callback(null, file);
        }

        const {path, contents} = file;

        let error = null;
        let result;

        try {
            const {attributes, body} = processFrontMatter(file);
            const html = await processMarkdown({path, contents: body}, {renderer});
            result = createTargetFile({path, contents: html}, options);
            renderer.reset();
        } catch (err) {
            error = err
        } finally {
            callback(error, result);
        }
    });
}

module.exports = md;
