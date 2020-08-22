const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { Transform } = require('stream');
const jquery = require('jquery');

class Subject {
  constructor() {
    this.observers = [];
    this.state = 0;
  }

  notifyAllObservers() {
    this.observers.forEach(o => {
      let self = this;
      o.update();
      return this;
    });
    return this;
  }

  getState() { return this.state; }

  setState(state) {
    this.state = state;
    this.notifyAllObservers();
    return this;
  }

  attach(observer) {
    this.observers.push(observer);
    return this;
  }
}
exports.Subject = Subject;

class Observer {
  constructor() {
    this.subject = new Subject();
    this.subject.attach(this);
  }

  update(fn=function () {}, ...args) {
    fn.apply(this, args);
    return this;
  }
}
exports.Observer = Observer;

class Agent {
  constructor(content) {
    this.content = content;
    this.find = this.find.bind(this);
    this.match = this.match.bind(this);
    this.count = this.count.bind(this);
    this.findAndHasNotFlags = this.findAndHasNotFlags.bind(this);
    this.findAndHasNotFlag = this.findAndHasNotFlag.bind(this);
    this.presence = this.presence.bind(this);
  }

  find(v) {
    return findFn(v, this.content);
  }

  match(v) {
    return matchContent(v, this.content);
  }

  count(v) {
    return countFn(v, this.content);
  }

  findAndHasNotFlags(v) {
    return findAndHasNotFlags(v, this.content);
  }

  findAndHasNotFlag(v) {
    return findAndHasNotFlag(v, this.content);
  }

  presence(args) {
    return presenceFn(this.content, args);
  }
}
exports.Agent = Agent;

let findFn = (v, content) => content.indexOf(v) > -1;
exports.find = findFn;

let matchContent = (v, content) => {
    v = new RegExp(v, 'g');
    content = content.toString();
    return content.match(v);
};
exports.matchContent = matchContent;

let countCheck = (mc) => mc === null ? 0 : Math.max(0, mc.length);

let countFn = (v, content) => {
    let out = 0;
    let agent = new Agent(content);
    out = agent.match(v);
    out = countCheck(out);
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

const _niceFlag = '--nice';
exports.niceFlag = _niceFlag;

let isExtractFlag = v => {
    return v === _extractFlag;
};

let hasExtractFlag = (args) => {
    return args.indexOf(_extractFlag) > -1;
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
    return hasExtractFlag(args) && (presence.length);
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
    let prp = [];
    if (hasRegExpFlagInArgs(ags) && (pr.length)) {
        prp = filterReFlag(pr);
        prp = pr.map(v => {
            return new RegExp(v);
        });
    }
    return prp;
};
exports.prepareRegExpPresence = prepareRegExpPresence;

const _revFlag = '--rev';
exports.revFlag = _revFlag;

let countPresenceMap = (pr, cnt) => {
    let agent = new Agent(cnt);
    let ctr = (v) => agent.count(v);
    return pr.filter(v => ctr(v) > 0).map(v => v + ' (' + ctr(v) + ')');
};
exports.countPresenceMap = countPresenceMap;

let bufferContentByPresence = (ags, pr, rev=null) => {
    pr = pr.filter(v => v !== '');
    let cnt = pr.join('\n') + '\n';
    if (hasExtractFlagWithPresence(ags, pr) && rev) {
      cnt = cnt.split('').reverse().join('');
    }
    return Buffer.from(cnt);
};
exports.bufferContentByPresence = bufferContentByPresence;

let bufferContentByFile = (fp, ags, pr, rev=null) => {
    let cnt = fp + '\n' + pr.join('\n') + '\n';
    if (!hasNotExtractFlagWithPresence(ags, pr) && rev) {
      cnt = cnt.split('').reverse().join('');
    }
    return Buffer.from(cnt);
};
exports.bufferContentByFile = bufferContentByFile;

let resumeCounter = (ctx, args, presence, raw, rev) => {
    let self = ctx;

    let resumePresenceCounterMap = countPresenceMap;

    if (hasNotExtractFlagWithPresence(args, presence)) {
        presence = resumePresenceCounterMap(presence, raw);
        if (presence.length) {
            self.push(bufferContentByPresence(args, presence, rev));
        }
    }
};

let extractFragment = (args, presence, raw) => {
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
            let reFlag = _regularExpressionFlag;
            let ufd = undefined;
            let ismtcc = matchingCase !== null;
            let isnmre = ismtcc && matchingCase[0] !== reFlag;
            let isnmi = ismtcc && matchingCase.input !== ufd;
            let matchingOpts = (isnmre && isnmi);
            if (matchingCase && matchingOpts) {
                out = matchingCase.input
            }
            return out;
        });
    }
    return pr;
};

let composeManipulation = (raw) => {
  let out = {};
  out['dom'] = new JSDOM(raw.toString());
  out['$'] = jquery(out.dom.window);
  out['_presence'] = [];
  return out;
};

let mapPresence = ($, presence, _presence) => {
  return presence.map(v => {
      let el = $(v);
      if (v !== '.' || v !== '') {
          el.each(i => {
              let parent = el.parent().eq(i);
              let hasNotPresenceParent = _presence.indexOf(parent.html()) === -1
              if (hasNotPresenceParent) {
                  _presence.push(parent.html());
              }
          });
      }
      return el;
  });
}

let resumeExtraction = (self, args, presence, presenceRegexp, raw) => {
    let rev = args.indexOf(_revFlag) > -1;
    let html = args.indexOf('--html') > -1;
    let context = this;
    if (hasExtractFlag(args) && html) {
        let { dom, $, _presence } = composeManipulation(raw);
        presence = mapPresence($, presence, _presence);
        if (presence.length) {
            self.push(bufferContentByPresence(args, _presence, rev));
            delete _presence;
        }
    } else if (hasExtractFlagWithPresence(args, presence)) {
        presence = extractFragment(args, presence, raw);
        presence = extractRegExpFragment(args, presence, presenceRegexp, raw);
        presence = presence.filter(v => v !== '');
        if (presence.length) {
          self.push(bufferContentByPresence(args, presence, rev));
        }
        process.exit(0);
    }
};

class ResumeCounterObserver extends Observer {
  constructor(subject) {
    super(subject);
    this.subject = subject;
    this.subject.attach(this);
    this.update = this.update.bind(this);
  }

  update() {
    let args = this.subject.getState();
    resumeCounter.apply(this, args);
  }
}

class ResumeExtractionObserver extends Observer {
  constructor(subject) {
    super(subject);
    this.subject = subject;
    this.subject.attach(this);
    this.update = this.update.bind(this);
  }

  update() {
    let args = this.subject.getState();
    resumeExtraction.apply(this, args);
  }
}

class Mediator {}

class ResumeCounterMediator extends Mediator {
  constructor(args) {
    super(args);

    let ResumeCounterSubject = new Subject();

    new ResumeCounterObserver(ResumeCounterSubject);

    ResumeCounterSubject.setState(args);
  }
}

class ResumeExtractionMediator extends Mediator {
  constructor(args) {
    super(args);

    let ResumeExtractionSubject = new Subject();

    new ResumeExtractionObserver(ResumeExtractionSubject);

    ResumeExtractionSubject.setState(args);
  }
}

let searchDataTransformFn = (args, filePath, line) => {
    return new Transform({
        transform(raw, encoding, callback) {
            let self = this;
            let rev = args.indexOf(_revFlag) > -1;
            let agent = new Agent(raw);
            let presence = agent.presence(args);
            let presenceRegexp = prepareRegExpPresence(args, presence);

            presence = filterReFlag(presence);

            new ResumeCounterMediator([self, args, presence, raw, rev]);
            new ResumeExtractionMediator([self,
                                          args,
                                          presence,
                                          presenceRegexp,
                                          raw]);

            callback();
        }
    });
};
exports.searchDataTransform = searchDataTransformFn;

let resumeCounterTraversal = (self, args, presence, raw, filePath) => {
    let rev = args.indexOf(_revFlag) > -1;
    if (hasNotExtractFlagWithPresence(args, presence)) {
        presence = countPresenceMap(presence, raw);
        if (presence.length) {
            self.push(bufferContentByFile(filePath, args, presence, rev));
        }
    }
};

let resumeExtractionTraversal = (self, ags, pr, prp, cnt, fp) => {
    let rev = ags.indexOf(_revFlag) > -1;

    if (hasExtractFlagWithPresence(ags, pr)) {
        if (hasNotRegExpFlag(ags)) {
            pr = pr.map(v => extractFn(v, cnt));
        } if (hasRegExpFlagAndRegExpMap(ags, prp)) {
            pr = prp.map((v, i) => {
                let out = '';
                let matchingCase = cnt.toString().match(v);
                let reFlag = _regularExpressionFlag;
                let ufd = undefined;
                let ismtcc = matchingCase !== null;
                let isnmre = ismtcc && matchingCase[0] !== reFlag;
                let isnmi = ismtcc && matchingCase.input !== ufd;
                let matchingOpts = (isnmre && isnmi);
                if (matchingCase && matchingOpts) {
                    out = matchingCase.input;
                }
                return out;
            });
        } if (pr.filter(v => v !== '').length) {
            self.push(bufferContentByFile(fp, ags, pr, rev));
        }
    }
};

class ResumeCounterTraversalObserver extends Observer {
  constructor(subject) {
    super(subject);
    this.subject = subject;
    this.subject.attach(this);
    this.update = this.update.bind(this);
  }

  update() {
    let args = this.subject.getState();
    resumeCounterTraversal.apply(this, args);
  }
}

class ResumeExtractionTraversalObserver extends Observer {
  constructor(subject) {
    super(subject);
    this.subject = subject;
    this.subject.attach(this);
    this.update = this.update.bind(this);
  }

  update() {
    let args = this.subject.getState();
    resumeExtractionTraversal.apply(this, args);
  }
}

class ResumeCounterTraversalMediator extends Mediator {
  constructor(args) {
    super(args);

    let ResumeCounterTraversalSubject = new Subject();

    new ResumeCounterTraversalObserver(ResumeCounterTraversalSubject);

    ResumeCounterTraversalSubject.setState(args);
  }
}

class ResumeExtractionTraversalMediator extends Mediator {
  constructor(args) {
    super(args);

    let ResumeExtractionTraversalSubject = new Subject();

    new ResumeExtractionTraversalObserver(ResumeExtractionTraversalSubject);

    ResumeExtractionTraversalSubject.setState(args);
  }
}

let traversalSearchDataTransformFn = (args, filePath, line) => {
    return new Transform({
        transform(raw, encoding, callback) {
            let self = this;
            let agent = new Agent(raw);
            let presence = agent.presence(args);
            let presenceRegexp = prepareRegExpPresence(args, presence);

            presence = filterReFlag(presence);

            new ResumeCounterTraversalMediator([self,
                                                args,
                                                presence,
                                                raw,
                                                filePath]);
            new ResumeExtractionTraversalMediator([self,
                                                   args,
                                                   presence,
                                                   presenceRegexp,
                                                   raw,
                                                   filePath]);

            callback();
        }
    });
};
exports.traversalSearchDataTransform = traversalSearchDataTransformFn;
