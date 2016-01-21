const PATH = require('path');
const FS = require('fs');

const argv = require('yargs').argv;
const production = !!(argv.production);

const through = require('through2');

const gutil = require('gulp-util');
const PluginError = gutil.PluginError;

const fm = require('front-matter');
const moment = require('moment');
const marked = require('marked');
const _ = require('lodash');
const Handlebars = require('handlebars');
const Highlight = require('highlight.js');

module.exports = function(options) {   
    const STREAMING_ERROR = 'Streaming not supported';
    const DATE_FORMAT = 'dddd, MMMM Do YYYY, HH:mm:ss';

    const REGEXP_HIGHLIGH = /(<pre>\s*)(<code class="lang-)/gi;
    const REGEXP_HIGHLIGH_REPLACE = '$1<code class="hljs lang-';
    const REGEXP_HIGHLIGH_EMPTY = /(<pre>\s*)(<code>)/gi;
    const REGEXP_HIGHLIGH_EMPTY_REPLACE = '$1<code class="hljs">';

    const TEMPLATES = {
        CSS: {
            TEMPLATE: Handlebars.compile('<link rel="stylesheet" href="{{path}}">'),
            TEMPLATE_INLINE: Handlebars.compile('<style>\n{{{content}}}\n</style>')
        },        
        JS: {
            TEMPLATE: Handlebars.compile('<script src="{{path}}" async></script>'),
            TEMPLATE_INLINE: Handlebars.compile('<script>\n{{{content}}}\n</script>')
        }
    };
    
    Handlebars.registerHelper('inline', function(params) {
        const path = PATH.resolve(options.publicRoot, params.hash.path.substr(1));
        const content = FS.readFileSync(path, 'utf-8');
        const type = params.hash.type;
        var result;

        if(production) {
            result = TEMPLATES[type].TEMPLATE_INLINE({content: content});
        } else {
            result = TEMPLATES[type].TEMPLATE({path: params.hash.path});
        }

        return result;
    }); 

    const glob = require("glob");

    Handlebars.registerHelper('process', function(context, params) {
        const dir = './public/';
        const files = glob.sync(dir + 'articles/**/*.html', {});
        const posts = files.map(function(file) {
            return {
                path: PATH.relative(dir, file),
                name: PATH.basename(file, '.html'),
                stat: FS.statSync(file)
            };
        });

        return context.fn({posts: posts});
    });        

    /**
    Main process method.

    @name process
    @param file {File} file to be processed
    @param enc {String} file encoding
    @param done {Function} callback to invoke when done processing
    **/
    const process = function(file, enc, done) {
        const content = file.contents.toString();
        const context = fm(content);  

        processFilePath(context, file);
        processFileStats(context, file);

        augmentContext(context, file, done);   
    };

    const augmentContext = function(context, file, done) {
        mergedOptions.augmentContext(context, file, function() {
            processMarkdown(context, file, function(err, htmlContent) {
                const html = registeredLayouts[context.attributes.layout]({
                    context: context,
                    content: htmlContent
                });

                file.contents = new Buffer(html);
                done(null, file);
            });            
        });
    };

    const augmentHTML = function(context, htmlContent) {
        htmlContent = htmlContent.replace(REGEXP_HIGHLIGH, REGEXP_HIGHLIGH_REPLACE);
        htmlContent = htmlContent.replace(REGEXP_HIGHLIGH_EMPTY, REGEXP_HIGHLIGH_EMPTY_REPLACE);

        return htmlContent;
    };

    const initMarked = function(options) {
        marked.setOptions(options);
    };

    const initHandlebarsLayouts = function(root, layouts) {
        const registeredLayouts = {};
        var template;

        for(var layoutName in layouts) {
            template = FS.readFileSync(PATH.resolve(root, layouts[layoutName]));
            registeredLayouts[layoutName] = Handlebars.compile(template.toString());
        }

        return registeredLayouts;
    };

    const initHandlebarsPartials = function(root, partials) {
        var template, compiledTemplate;

        for(var partialName in partials) {
            template = FS.readFileSync(PATH.resolve(root, partials[partialName]));
            compiledTemplate = Handlebars.compile(template.toString());

            Handlebars.registerPartial(partialName, compiledTemplate);
        }
    };

    const processMarkdown = function(context, file, callback) {
        marked(context.body, function(err, htmlContent) {
            if(!err) {
                augmentedHTMLContent = augmentHTML(context, htmlContent);            
                callback(err, augmentedHTMLContent);            
            } else {
                throw err;
            }
        });
    };

    const processCode = function(content, language) {
        var result;

        if(typeof language === 'undefined') {
            result = Highlight.highlightAuto(content, ['javascript', 'css', 'scss', 'html', 'xml']).value;
        } else {
            result = Highlight.highlight(language, content).value;
        }

        return result;
    };

    const processTemplates = function() {
        
    };

    const processFilePath = function(context, file) {
        file.path = gutil.replaceExtension(file.path, '.html');
        context.attributes.path = PATH.relative(file.base, file.path);   
    };

    const processFileStats = function(context, file) {
        context.attributes.path = PATH.relative(file.base, file.path);
        context.attributes.stat = file.stat;

        context.attributes.stat.atime = moment(file.stat.atime).format(mergedOptions.dateFormat);
        context.attributes.stat.ctime = moment(file.stat.ctime).format(mergedOptions.dateFormat);
        context.attributes.stat.mtime = moment(file.stat.mtime).format(mergedOptions.dateFormat);
        context.attributes.stat.birthtime = moment(file.stat.birthtime).format(mergedOptions.dateFormat);
    };

    /**
    Error handling method.

    @name errorHandler
    @param err {Object} error to be printed and emitted
    **/
    const errorHandler = function(err) {
        const PLUGIN_NAME = 'markdown';

        this.emit('error', new PluginError(PLUGIN_NAME, err));
        console.error(err);  
    };

    /**
    Merge passed options with default values.
    **/
    const mergedOptions = _.merge({}, {
        gfm: true,
        dateFormat: DATE_FORMAT,
        highlight: processCode,
        augmentContext: function(context, file, callback) {
            callback();
        }
    }, options); 


    const registeredLayouts = initHandlebarsLayouts(mergedOptions.root, mergedOptions.layouts);    
    initHandlebarsPartials(mergedOptions.root, mergedOptions.partials);
    
    initMarked(mergedOptions);

    /**
    Invokation of stream processing.

    @param anonymout {Function} callback function to invoke
    **/
    return through.obj(function (file, enc, done) {
        if (file.isNull()) {
            return done(null, file);
        } 

        if (file.isStream()) {
            errorHandler.call(this, STREAMING_ERROR);
            return done(null, file);
        }            
    
        try {
            process.call(this, file, enc, done);
        } catch (err) {
            errorHandler.call(this, err);
        }
    });
};
