import through from 'through2';
import marked from 'marked';
import fm from 'front-matter';

const md = function(file, enc, done) {
    const content = file.contents.toString();
    const meta = fm(content);

    console.log(meta);

    marked(meta.body, (err, html) => {
        console.log(html);
        done();
    });
};

export default function() {
    return through.obj((file, enc, done) => {
        if (file.isNull() || file.isStream()) {
            return done(null, file);
        }            
    
        md.call(this, file, enc, done);
    }); 
}
