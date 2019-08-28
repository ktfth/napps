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

let searchDataTransformFn = (args) => {
    return new Transform({
        transform(chunk, encoding, callback) {
            let raw = chunk.toString();
            let presence = args.filter(v => {
                if (findFn(v, raw) && (v !== _extractFlag)) {
                    return v;
                }
            });
            if (args.indexOf(_extractFlag) === -1 && (presence.length)) {
                presence = presence.map(v => v + ' (' + countFn(v, raw) + ')')
                this.push(Buffer.from('Present: ' + presence.join('\n') + '\n'));
            } else if (args.indexOf(_extractFlag) > -1 && (presence.length)) {
                presence = presence.map(v => extractFn(v, raw));
                this.push(Buffer.from(presence.join('\n')) + '\n');
            } else {
                this.push(Buffer.from('Unpresent terms!\n'));
            }

            callback();
        }
    });
};
exports.searchDataTransform = searchDataTransformFn;
