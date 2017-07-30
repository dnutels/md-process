'use strict';

const marked = require('marked');

class Renderer extends marked.Renderer {
    static get H1() {
        return 'h1'
    };

    static get P() {
        return 'p'
    };

    constructor() {
        super();
        this.collector = [];
    }

    getAll() {
        return this.collector;
    }

    get(type = '') {
        return this.collector.filter(item => item.type === type);
    }

    heading(text, level) {
        const type = `h${level}`;
        this.collector.push({text, type});
    }

    paragraph(text) {
        const type = `p`;
        this.collector.push({text, type});
    }

    reset() {
        collector = [];
    }
}

module.exports = Renderer;
