import PATH from 'path';

import through from 'through2';
import marked from 'marked';
import fm from 'front-matter';
import VFile from 'vinyl';

const md = function(contents, callback) {
    marked(contents, callback);
};

const createTargetFile = function(path, contents) {
    const parts = PATH.parse(path);
    const targetPath = `${parts.dir}/${parts.name}.html`;

    const file = new VFile({
        path: targetPath,
        contents: new Buffer(contents)
    });

    return file;
};

const createMetaFile = function(path, contents) {
    const parts = PATH.parse(path);
    const targetPath = `${parts.dir}/${parts.name}.json`;

    const file = new VFile({
        path: targetPath,
        contents: new Buffer(contents)
    });

    return file;
};

export function processDiscrete({path, contents}, callback) {
    const result = fm(contents.toString());
    const {attributes, body} = result;

    md(body, (err, htmlContent) => {
        if (!err) {
            const contentFile = createTargetFile(path, htmlContent);
            const metaFile = createTargetFile(path, htmlContent);
            contentFile.meta = attributes;
            // // callback(null, {meta: attributes, file: file});
            // callback(null, file, attributes);
            this.push(contentFile);   
            // this.push(metaFile);   
            callback();
        } else {
            callback(err);
        }
    }); 
}

export default function() {
    return through.obj(function(file, enc, callback) {
        if (file.isNull() || file.isStream()) {
            return callback(null, file);
        }            

        processDiscrete.call(this, file, (err, fileInfo) => {
            if (!err) {
                callback(err, fileInfo);            
            } else {
                callback(err);
            }
        });
    }); 
}
