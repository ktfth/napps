const { Transform } = require('stream');

let findFn = (v, content) => content.indexOf(v) > -1;
exports.find = findFn;

let countFn = (v, content) => {
    let out = 0;
    out = content.match(new RegExp(v, 'ig'));
    out = out === null ? 0 : out.length;
    return out;
};
exports.count = countFn;

let extractFn = (v, content) => {
    let out = '';
    out = content.split('\n').filter(l => findFn(v, l)).join('\n');
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

let hasRegExpFlagAndRegExpMap = (args, presenceRegexp) => {
    let hasRegExpFlag = args.indexOf(_regularExpressionFlag > -1);
    return hasRegExpFlag && presenceRegexp !== undefined;
};
exports.hasRegExpFlagAndRegExpMap = hasRegExpFlagAndRegExpMap;

let filterDirectory = directory => {
    return directory.filter(dirent => {
        return dirent.isFile() && !(dirent.name.indexOf('.') === 0);
    });
};
exports.filterDirectory = filterDirectory;

let filterFragments = (args) => {
    return args.filter(v => {
        return !(v.indexOf('--') === 0);
    });
};
exports.filterFragments = filterFragments;

let searchDataTransformFn = (args, filePath, line) => {
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

    let prepareRegExpPresence = (args, presence) => {
      if (hasRegExpFlagInArgs(args) && (presence.length)) {
          presenceRegexp = presence.map(v => {
              return new RegExp(v, 'g');
          });
      }
    };

    return new Transform({
        transform(chunk, encoding, callback) {
            let self = this;
            let raw = chunk.toString();
            let presence = presenceFn(raw, args);
            let presenceRegexp = prepareRegExpPresence(args, presence);

            let filterReFlag = (presence) => {
              presence = filterFragments(presence);
              return presence;
            }

            let resumePresenceCounterMap = (raw) => {
                let ctr = (v) => countFn(v, raw);
                return presence.filter(v => ctr(v) > 0).map(v => v + ' (' + ctr(v) + ')');
            };

            let bufferContentByPresence = (presence) => {
                let content = presence.join('\n') + '\n';
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

            let extractRegExpFragment = (args, presence, presenceRegexp) => {
                if (hasRegExpFlagAndRegExpMap(args, presenceRegexp)) {
                    presence = presenceRegexp.map((v, i) => {
                        let out = '';
                        let matchingCase = raw.match(v);
                        out = matchingCase[0] + ' (' + matchingCase.input + ')'
                        return out;
                    });
                }
                return presence;
            };

            let resumeExtraction = (args, presence, presenceRegexp, raw) => {
                if (hasExtractFlagWithPresence(args, presence)) {
                    presence = extractFragment(presence, raw);
                    presence = extractRegExpFragment(args, presence, presenceRegexp);
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

    let filterReFlag = (presence) => {
      presence = filterFragments(presence);
      return presence;
    }

    let prepareRegExpPresence = (args, presence) => {
      if (hasRegExpFlagInArgs(args) && (presence.length)) {
          presenceRegexp = presence.map(v => {
              return new RegExp(v, 'g');
          });
      }
    };

    return new Transform({
        transform(chunk, encoding, callback) {
            let self = this;
            let raw = chunk.toString();
            let presence = presenceFn(raw, args);
            let presenceRegexp = prepareRegExpPresence(args, presence);

            let countPresenceMap = (presence, raw) => {
                let ctr = (v) => countFn(v, raw);
                return presence.filter(v => ctr(v) > 0).map(v => v + ' (' + ctr(v) + ')');
            };

            let bufferContentByFile = (filePath, presence) => {
                let content = filePath + '\n' + presence.join('\n') + '\n';
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

            let resumeExtraction = (args, presence, presenceRegexp, raw) => {
                if (hasExtractFlagWithPresence(args, presence)) {
                    if (hasNotRegExpFlag(args)) {
                        presence = presence.map(v => extractFn(v, raw));
                    } if (hasRegExpFlagAndRegExpMap(args, presenceRegexp)) {
                        presence = presenceRegexp.map((v, i) => {
                            let out = '';
                            let matchingCase = raw.match(v);
                            out = matchingCase[0] + ' (' + matchingCase.input + ')'
                            return out;
                        });
                    } if (presence.filter(v => v !== '').length) {
                        self.push(bufferContentByFile(filePath, presence));
                    }
                }
            };

            presence = filterReFlag(presence);

            resumeCounter(args, presence, raw);
            resumeExtraction(args, presence, presenceRegexp, raw);

            callback();
        }
    });
};
exports.traversalSearchDataTransform = traversalSearchDataTransformFn;
