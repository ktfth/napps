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

    it('find and has not extraction flag', () => {
        assert.ok(nap.findAndHasNotFlag('love', 'i love grapes'));
    })
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

    it('has not regexp flag function', () => {
        assert.ok(nap.hasNotRegExp('--other'));
    });

    it('has regexp in args', () => {
        assert.ok(nap.hasRegExpFlagInArgs(['--re']));
    });

    it('has not extraction with regexp flag function', () => {
        assert.ok(nap.hasNotExtractionWithRegExpFlag('--other'));
    });

    it('has not regexp flag with presence', () => {
        assert.ok(nap.hasNotExtractFlagWithPresence(['--other'], ['some-value']));
    });

    it('has extract flag with presence', () => {
        assert.ok(nap.hasExtractFlagWithPresence(['--extract'], ['some-value']));
    });

    it('has regexp flag and presence regexp map', () => {
        assert.ok(nap.hasRegExpFlagAndRegExpMap(['--re'],
                                                [new RegExp('some-value')]));
    })

    it('has not regexp flag', () => {
        assert.ok(nap.hasNotRegExpFlag(['--other']));
    });
});

describe('Nap search transform', () => {
    it('instantiation across function', () => {
        assert.ok(nap.searchDataTransform([]) instanceof Transform);
    });
});

describe('Nap traversal search transform', () => {
    it('instantiation across function', () => {
        assert.ok(nap.traversalSearchDataTransform([]) instanceof Transform);
    });
});
