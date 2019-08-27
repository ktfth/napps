const isPipe = !Boolean(process.stdin.isTTY);
const { Transform } = require('stream');
const args = process.argv.slice(2);
const searchData = new Transform({
    transform(chunk, encoding, callback) {
        let raw = chunk.toString();
        let presence = args.filter(v => {
            if (findFn(v, raw)) {
                return v;
            }
        });
        if (presence.length) {
            this.push(Buffer.from('Present: ' + presence.join(' ') + '\n'));
        } else {
            this.push(Buffer.from('Unpresent terms!\n'));
        }

        callback();
    }
})

if (isPipe) {
    process.stdin.pipe(searchData).pipe(process.stdout);
    process.stdin.resume();
}

let findFn = (v, content) => content.indexOf(v) > -1;
exports.find = findFn;
