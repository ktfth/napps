const { Transform } = require('stream');

let findFn = (v, content) => content.indexOf(v) > -1;
exports.find = findFn;

let countFn = (v, content) => {
    let out = 0;
    out = content.toString().match(new RegExp(v, 'ig'));
    out = out === null ? 0 : out.length;
    return out;
};
exports.count = countFn;

let extractFn = (v, content) => {
    let out = '';
    out = content.toString().split('\n').filter(l => findFn(v, l)).join('\n');
    return out;
};
exports.extract = extractFn;

const _extractFlag = '--extract';
exports.extractFlag = _extractFlag;

const _regularExpressionFlag = '--re';
exports.regularExpressionFlag = _regularExpressionFlag;

const _excludeFlag = '--exclude';
exports.excludeFlag = _excludeFlag;

const _argSep = '=';
exports.argSep = _argSep;

let hasExtractFlag = v => {
    return v === _extractFlag;
};

let hasNotExtraction = v => {
    return v !== _extractFlag;
};
exports.hasNotExtraction = hasNotExtraction;

let hasNotRegExp = v => {
    return v !== _regularExpressionFlag;
};
exports.hasNotRegExp = hasNotRegExp;

let hasNotExtractionWithRegExpFlag = v => {
    let out = false;
    let isNotExtractFlag = hasNotExtraction(v);
    let isNotRegExpFlag = v !== _regularExpressionFlag;
    out = (isNotExtractFlag && isNotRegExpFlag);
    return out;
};
exports.hasNotExtractionWithRegExpFlag = hasNotExtractionWithRegExpFlag;

let findAndHasNotFlags = (v, content) => {
    return hasNotExtractionWithRegExpFlag(v) && findFn(v, content);
};
exports.findAndHasNotFlags = findAndHasNotFlags;

let findAndHasNotFlag = (v, content) => {
    return hasNotExtraction(v) && findFn(v, content);
};
exports.findAndHasNotFlag = findAndHasNotFlag;

let hasRegExpFlagInArgs = (args) => {
    return args.indexOf(_regularExpressionFlag) > -1;
};
exports.hasRegExpFlagInArgs = hasRegExpFlagInArgs;

let hasNotRegExpFlag = (args) => {
    return args.indexOf(_regularExpressionFlag) === -1;
};
exports.hasNotRegExpFlag = hasNotRegExpFlag;

let hasNotExtractFlagWithPresence = (args, presence) => {
    return args.indexOf(_extractFlag) === -1 && (presence.length);
}
exports.hasNotExtractFlagWithPresence = hasNotExtractFlagWithPresence;

let hasExtractFlagWithPresence = (args, presence) => {
    return args.indexOf(_extractFlag) > -1 && (presence.length);
};
exports.hasExtractFlagWithPresence = hasExtractFlagWithPresence;

let hasRegExpFlagAndRegExpMap = (args, presenceRegexp=[]) => {
    let hasRegExpFlag = hasRegExpFlagInArgs(args);
    return hasRegExpFlag && (presenceRegexp.length);
};
exports.hasRegExpFlagAndRegExpMap = hasRegExpFlagAndRegExpMap;

let filterDirectory = directory => {
    return directory.filter(dirent => {
        return dirent.isFile() && !(dirent.name.indexOf('.') === 0);
    });
};
exports.filterDirectory = filterDirectory;

let filterIsDirectory = directory => {
    return directory.filter(dirent => {
        return dirent.isDirectory() && !(dirent.name.indexOf('.') === 0);
    });
};
exports.filterIsDirectory = filterIsDirectory;

let filterExclude = args => {
    return args.filter(v => {
        if (v.indexOf(_excludeFlag) > -1) {
          return v;
        }
    });
};
exports.filterExclude = filterExclude;

let excludesMap = excludes => {
    return excludes.map(v => v.split(_argSep));
};
exports.excludesMap = excludesMap;

let filterFragments = (args) => {
    return args.filter(v => {
        return !(v.indexOf('--') === 0);
    });
};
exports.filterFragments = filterFragments;

let presenceFn = (raw, args) => {
    return args.filter(v => {
        if (v.indexOf('--') === -1) {
          return v;
        } if (findAndHasNotFlags(v, raw)) {
            return v;
        } if (findAndHasNotFlag(v, raw)) {
            return v;
        }
    });
};
exports.presence = presenceFn;

let filterReFlag = (presence) => {
  presence = filterFragments(presence);
  return presence;
};
exports.filterReFlag = filterReFlag;

let prepareRegExpPresence = (ags, pr) => {
    if (hasRegExpFlagInArgs(ags) && (pr.length)) {
        prp = filterReFlag(pr);
        prp = pr.map(v => {
            return new RegExp(v);
        });
    }
    return prp;
};
exports.prepareRegExpPresence = prepareRegExpPresence;

let searchDataTransformFn = (args, filePath, line) => {
    return new Transform({
        transform(raw, encoding, callback) {
            let self = this;
            let rev = args.indexOf('--rev') > -1;
            let presence = presenceFn(raw, args);
            let presenceRegexp = prepareRegExpPresence(args, presence);

            let resumePresenceCounterMap = (raw) => {
                let ctr = (v) => countFn(v, raw);
                return presence.filter(v => ctr(v) > 0).map(v => v + ' (' + ctr(v) + ')');
            };

            let bufferContentByPresence = (presence) => {
                let content = presence.join('\n') + '\n';
                if (!hasNotExtractFlagWithPresence(args, presence) && rev) {
                  content = content.split('').reverse().join('');
                }
                return Buffer.from(content);
            };

            let resumeCounter = (args, presence, raw) => {
                if (hasNotExtractFlagWithPresence(args, presence)) {
                    presence = resumePresenceCounterMap(raw);
                    if (presence.length) {
                        self.push(bufferContentByPresence(presence));
                    }
                }
            };

            let extractFragment = (presence, raw) => {
                if (hasNotRegExpFlag(args)) {
                    presence = presence.map(v => extractFn(v, raw));
                }
                return presence;
            };

            let extractRegExpFragment = (ags, pr, prp, cnt) => {
                if (hasRegExpFlagAndRegExpMap(ags, prp)) {
                    pr = prp.map((v, i) => {
                        let out = '';
                        let matchingCase = cnt.toString().match(v);
                        if (matchingCase && (matchingCase[0] !== _regularExpressionFlag && matchingCase.input !== undefined)) {
                            out = matchingCase.input
                        }
                        return out;
                    });
                }
                return pr;
            };

            let resumeExtraction = (args, presence, presenceRegexp, raw) => {
                if (hasExtractFlagWithPresence(args, presence)) {
                    presence = extractFragment(presence, raw);
                    presence = extractRegExpFragment(args, presence, presenceRegexp, raw);
                    presence = presence.filter(v => v !== '');
                    if (presence.length) {
                      self.push(bufferContentByPresence(presence));
                    }
                    process.exit(0);
                }
            };

            presence = filterReFlag(presence);

            resumeCounter(args, presence, raw);
            resumeExtraction(args, presence, presenceRegexp, raw);

            callback();
        }
    });
};
exports.searchDataTransform = searchDataTransformFn;

let traversalSearchDataTransformFn = (args, filePath, line) => {
    return new Transform({
        transform(raw, encoding, callback) {
            let self = this;
            let rev = args.indexOf('--rev') > -1;
            let presence = presenceFn(raw, args);
            let presenceRegexp = prepareRegExpPresence(args, presence);

            let countPresenceMap = (presence, raw) => {
                let ctr = (v) => countFn(v, raw);
                return presence.filter(v => ctr(v) > 0).map(v => v + ' (' + ctr(v) + ')');
            };

            let bufferContentByFile = (filePath, presence) => {
                let content = filePath + '\n' + presence.join('\n') + '\n';
                if (!hasNotExtractFlagWithPresence(args, presence) && rev) {
                  content = content.split('').reverse().join('');
                }
                return Buffer.from(content);
            };

            let resumeCounter = (args, presence, raw) => {
                if (hasNotExtractFlagWithPresence(args, presence)) {
                    presence = countPresenceMap(presence, raw);
                    if (presence.length) {
                        self.push(bufferContentByFile(filePath, presence));
                    }
                }
            };

            let resumeExtraction = (ags, pr, prp, cnt, fp) => {
                if (hasExtractFlagWithPresence(ags, pr)) {
                    if (hasNotRegExpFlag(ags)) {
                        pr = pr.map(v => extractFn(v, cnt));
                    } if (hasRegExpFlagAndRegExpMap(ags, prp)) {
                        pr = prp.map((v, i) => {
                            let out = '';
                            let matchingCase = cnt.toString().match(v);
                            if (matchingCase && (matchingCase[0] !== _regularExpressionFlag && matchingCase.input !== undefined)) {
                                out = matchingCase.input;
                            }
                            return out;
                        });
                    } if (pr.filter(v => v !== '').length) {
                        self.push(bufferContentByFile(fp, pr));
                    }
                }
            };

            presence = filterReFlag(presence);

            resumeCounter(args, presence, raw);
            resumeExtraction(args, presence, presenceRegexp, raw, filePath);

            callback();
        }
    });
};
exports.traversalSearchDataTransform = traversalSearchDataTransformFn;
