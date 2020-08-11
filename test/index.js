const fs = require('fs');
const nap = require('../');
const path = require('path');
const assert = require('assert');

const { Transform } = require('stream');

describe('Nap Agent', () => {
  it('should be an instance of described', () => {
    let actual = new nap.Agent();
    assert.ok(actual instanceof nap.Agent);
  });

  it('should have content', () => {
    let actual = new nap.Agent('some content about agent');
    assert.equal(actual.content, 'some content about agent');
  });

  it('should find text in content', () => {
    let actual = new nap.Agent('i love grapes');
    assert.ok(actual.find('love'), 'failing on find content');
  });

  it('should not find the text in content', () => {
    let actual = new nap.Agent('i love grapes');
    assert.ok(!actual.find('orange'), 'failing to be tolerant');
  });

  it('should match content by term', () => {
    let actual = new nap.Agent('some-value');
    assert.ok(actual.match('some') !== null);
  });

  it('should match content by term returning the input', () => {
    let v = new RegExp('some', 'g');
    let actual = new nap.Agent('some-value');
    let expected = 'some-value'.match(v);
    assert.deepEqual(actual.match('some'), expected);
  });

  it('should count some times the content appears', () => {
    let actual = new nap.Agent('sample some sample');
    assert.equal(actual.count('sample'), 2);
  });

  it('should find and has not verified flags', () => {
    let actual = new nap.Agent('i love grapes');
    assert.ok(actual.findAndHasNotFlags('love'));
  });

  it('should find and has not extraction flag', () => {
    let actual = new nap.Agent('i love grapes');
    assert.ok(actual.findAndHasNotFlag('love'));
  });

  it('should have presence', () => {
    let actual = new nap.Agent('some-value');
    assert.deepEqual(actual.presence(['--extract', 'some-value']), ['some-value']);
  });
});

describe('Nap text searcher', () => {
    it('find text in content', () => {
        assert.ok(nap.find('love', 'i love grapes'), 'failing on find content')
    });

    it('find not the text in content', () => {
        assert.ok(!nap.find('orange', 'i love grapes'), 'failing to be tolerant')
    });

    it('match content by term', () => {
        assert.ok(nap.matchContent('some', 'some-value') !== null);
    });

    it('math content by term returning input', () => {
        let v = new RegExp('some', 'g')
        let expected = 'some-value'.match(v);
        assert.deepEqual(nap.matchContent('some', 'some-value'), expected);
    });

    it('count some times the content appears', () => {
        assert.equal(nap.count('sample', 'sample some sample'), 2);
    });

    it('find and has not verified flags', () => {
        assert.ok(nap.findAndHasNotFlags('love', 'i love grapes'));
    });

    it('find and has not extraction flag', () => {
        assert.ok(nap.findAndHasNotFlag('love', 'i love grapes'));
    });

    it('presence', () => {
        assert.deepEqual(nap.presence('some-value', ['--extract', 'some-value']), ['some-value']);
    });

    it('filter re flag', () => {
        assert.deepEqual(nap.filterReFlag(['--re', 'some-value']), ['some-value']);
    });

    it('prepare regexp fragment', () => {
        let prp = nap.prepareRegExpPresence(['--re'], ['some-value']);
        console.log(prp);
        assert.ok(prp.length > 0);
    });

    it('nice flag', () => {
        assert.equal(nap.niceFlag, '--nice');
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

    it('exclude flag', () => {
        assert.equal(nap.excludeFlag, '--exclude');
    });

    it('argSep', () => {
        assert.equal(nap.argSep, '=');
    });

    it('reverse flag', () => {
        assert.equal(nap.revFlag, '--rev');
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

describe('Nap essentials', () => {
    it('filter fragments', () => {
        assert.deepEqual(nap.filterFragments(['--extract', 'test']), ['test']);
    });

    it('filter directory', () => {
        let dirsPath = path.resolve(process.cwd(), 'test');
        let dirs = fs.readdirSync(dirsPath, {
            withFileTypes: true
        });
        assert.ok(nap.filterDirectory(dirs).length > 0);
    });

    it('filter is directory', () => {
        let dirsPath = path.resolve(process.cwd(), 'test');
        let dirs = fs.readdirSync(dirsPath, {
            withFileTypes: true
        });
        assert.ok(nap.filterIsDirectory(dirs).length > 0);
    });

    it('filter exclude', () => {
        assert.deepEqual(nap.filterExclude(['--exclude=txt', 'some-test']), ['--exclude=txt']);
    });

    it('excludes map', () => {
        assert.deepEqual(nap.excludesMap(['--exclude=txt']), [['--exclude', 'txt']]);
    });

    it('count presence map', () => {
        assert.ok(nap.countPresenceMap(['some'], 'some-value').length > 0);
    });
});

describe('Nap buffering', () => {
    it('method return buffer instance', () => {
        assert.ok(nap.bufferContentByPresence(['sample'], ['some-value']) instanceof Buffer);
    });

    it('method return buffer instance by file', () => {
        assert.ok(nap.bufferContentByFile('/dev/null', ['sample'], ['some-value']) instanceof Buffer);
    });
});
