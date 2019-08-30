const assert = require('assert');
const nap = require('../');

const { Transform } = require('stream');

describe('Nap text searcher', () => {
    it('find text in content', () => {
        assert.ok(nap.find('love', 'i love grapes'), 'failing on find content')
    });

    it('find not the text in content', () => {
        assert.ok(!nap.find('orange', 'i love grapes', 'failing to be tolerant'))
    });

    it('count some times the content appears', () => {
        assert.equal(nap.count('sample', 'sample some sample'), 2);
    });

    it('find and has not verified flags', () => {
        assert.ok(nap.findAndHasNotFlags('love', 'i love grapes'));
    });
});

describe('Nap text extractor', () => {
    it('simple slicer', () => {
        assert.equal(nap.extract('some', 'some sample\nanother sample'), 'some sample');
    });
});

describe('Nap flags', () => {
    it('extract', () => {
        assert.equal(nap.extractFlag, '--extract');
    });

    it('regular expression', () => {
        assert.equal(nap.regularExpressionFlag, '--re');
    });

    it('has not extraction flag function', () => {
        assert.ok(nap.hasNotExtraction('--other'));
    })

    it('has not extraction with regexp flag function', () => {
        assert.ok(nap.hasNotExtractionWithRegExpFlag('--other'));
    });
});

describe('Nap transform', () => {
    it('instantiation across function', () => {
        assert.ok(nap.searchDataTransform([]) instanceof Transform);
    });
});
