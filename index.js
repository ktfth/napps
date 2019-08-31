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
              return new RegExp(v);
          });
      }
    };

    return new Transform({
        transform(chunk, encoding, callback) {
            let self = this;
            let raw = chunk.toString();
            let presence = presenceFn(raw, args);
            let presenceRegexp = prepareRegExpPresence(args, presence);

            let resumePresenceCounterMap = (raw) => {
                return presence.map(v => v + ' (' + countFn(v, raw) + ')');
            };

            let resumeCounter = (args, presence, raw) => {
                if (hasNotExtractFlagWithPresence(args, presence)) {
                    presence = resumePresenceCounterMap(raw);
                    self.push(Buffer.from(presence.join('\n')) + '\n');
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
                      self.push(Buffer.from(presence.join('\n')) + '\n');
                    }
                    process.exit(0);
                }
            };

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

    let prepareRegExpPresence = (args, presence) => {
      if (hasRegExpFlagInArgs(args) && (presence.length)) {
          presenceRegexp = presence.map(v => {
              return new RegExp(v);
          });
      }
    };

    return new Transform({
        transform(chunk, encoding, callback) {
            let raw = chunk.toString();
            let presence = presenceFn(raw, args);
            let presenceRegexp = prepareRegExpPresence(args, presence);

            if (hasNotExtractFlagWithPresence(args, presence)) {
                    presence = presence.map(v => v + ' (' + countFn(v, raw) + ')')
                    this.push(Buffer.from(filePath + '\n' + presence.join('\n') + '\n'));
            } else if (hasExtractFlagWithPresence(args, presence)) {
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
                    this.push(Buffer.from(filePath + '\n' + presence.join('\n')) + '\n');
                }
            }

            callback();
        }
    });
};
exports.traversalSearchDataTransform = traversalSearchDataTransformFn;
