let findFn = (v, content) => content.indexOf(v) > -1;
exports.find = findFn;

let countFn = (v, content) => {
    let out = 0;
    out = content.match(new RegExp(v, 'ig')).length;
    return out;
};
exports.count = countFn;
