const expect = require('chai').expect;

describe('Test', () => {
    describe('should', () => {
        it('pass', () => {
            const foo = 'bar';
            expect(foo).to.be.a('string');
            expect(foo).to.equal('bar');
            expect(foo).to.have.length(3);
        });

        context('or', () => {
            it('fail', function() {
                expect(foo).to.be.a('number');
            });
        })
    });
});