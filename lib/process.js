'use strict';

const through = require('through2');

function md(options) {
    return through.obj(async function(file, enc, callback) {
        let result;

        if (file.isNull() || file.isStream()) {
            result = file;
        }

        result = file;

        callback(null, result);
    });
}

module.exports = md;
