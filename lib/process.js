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

export function processDiscrete({path, contents}, callback) {
    const result = fm(contents.toString());
    const {attributes, body} = result;

    md(body, (err, htmlContent) => {
        if (!err) {
            const file = createTargetFile(path, htmlContent);
            callback(null, {meta: attributes, file: file});
        } else {
            callback(err);
        }
    }); 
}

export default function() {
    return through.obj(function(file, enc, done) {
        if (file.isNull() || file.isStream()) {
            return done(null, file);
        }            

        processDiscrete(file, (err, fileInfo) => {
            console.log(fileInfo);
            if (!err) {
                this.push(fileInfo);   
                done();            
            } else {
                done(err);
            }
        });
    }); 
}
