const { Transform } = require('stream');

let findFn = (v, content) => content.indexOf(v) > -1;
exports.find = findFn;

let countFn = (v, content) => {
    let out = 0;
    out = content.match(new RegExp(v, 'ig')).length;
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

let hasNotExtractionWithRegExpFlag = v => {
    let out = false;
    let isNotExtractFlag = hasNotExtraction(v);
    let isNotRegExpFlag = v !== _regularExpressionFlag;
    out = (isNotExtractFlag && isNotRegExpFlag);
    return out;
};
exports.hasNotExtractionWithRegExpFlag = hasNotExtractionWithRegExpFlag;

let findAndHasNotFlags = (v, content) => {
    return findFn(v, content) && hasNotExtractionWithRegExpFlag(v);
};
exports.findAndHasNotFlags = findAndHasNotFlags;

let searchDataTransformFn = (args, filePath, line) => {
    let presenceFn = (raw, args) => {
        return args.filter(v => {
            if (findAndHasNotFlags(v, raw)) {
                return v;
            } if (findFn(v, raw) && (v !== _extractFlag)) {
                return v;
            }
        });
    };

    return new Transform({
        transform(chunk, encoding, callback) {
            let raw = chunk.toString();
            let presence = presenceFn(raw, args);
            let presenceRegexp = [];
            if (args.indexOf(_regularExpressionFlag) > -1 && (presence.length)) {
                presenceRegexp = presence.map(v => {
                    return new RegExp(v);
                });
            } if (args.indexOf(_extractFlag) === -1 && (presence.length)) {
                    presence = presence.map(v => v + ' (' + countFn(v, raw) + ')')
                    if (process.stdin.isTTY) {
                        this.push(Buffer.from(filePath + ':' + line + '\n' + presence.join('\n') + '\n'));
                    }

                    if (!process.stdin.isTTY) {
                        this.push(Buffer.from(presence.join('\n')) + '\n');
                    }
            } else if (args.indexOf(_extractFlag) > -1 && (presence.length)) {
                if (args.indexOf(_regularExpressionFlag) === -1) {
                    presence = presence.map(v => extractFn(v, raw));
                } else if (args.indexOf(_regularExpressionFlag > -1)) {
                    presence = presenceRegexp.map((v, i) => {
                        let out = '';
                        let matchingCase = raw.match(v);
                        out = matchingCase[0] + ' (' + matchingCase.input + ')'
                        return out;
                    });
                }

                if (process.stdin.isTTY) {
                    this.push(Buffer.from(filePath + ':' + line + '\n' + presence.join('\n')) + '\n');
                }

                if (!process.stdin.isTTY) {
                    this.push(Buffer.from(presence.join('\n')) + '\n');
                }
            }

            callback();
        }
    });
};
exports.searchDataTransform = searchDataTransformFn;
