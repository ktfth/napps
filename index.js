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

let searchDataTransformFn = (args) => {
    return new Transform({
        transform(chunk, encoding, callback) {
            let raw = chunk.toString();
            let presence = args.filter(v => {
                if (findFn(v, raw) && (v !== _extractFlag || v !== _regularExpressionFlag)) {
                    return v;
                }
            });
            let presenceRegexp = [];
            if (args.indexOf(_regularExpressionFlag) > -1 && (presence.length)) {
                presenceRegexp = presence.map(v => {
                    return new RegExp(v);
                });
            } if (args.indexOf(_extractFlag) === -1 && (presence.length)) {
                    presence = presence.map(v => v + ' (' + countFn(v, raw) + ')')
                this.push(Buffer.from(presence.join('\n') + '\n'));
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

                this.push(Buffer.from(presence.join('\n')) + '\n');
            }

            callback();
        }
    });
};
exports.searchDataTransform = searchDataTransformFn;
























