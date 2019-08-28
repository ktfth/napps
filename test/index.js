const assert = require('assert');
const nap = require('../');

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
});

describe('Nap text extractor', () => {
    it('simple slicer', () => {
        assert.equal(nap.extract('some', 'some sample\nanother sample'), 'some sample');
    });
});
