// flow.js: asynchronous processes flow pattern
(function(global) {

// --- header ----------------------------------------------
function Flow(waits,    // @arg Integer: Number of wait for processes
              callback, // @arg Flow: callback on completion of processes.
                        //            callback(err:Error, args:MixArray)
              tag) {    // @arg String(= ""): tag for Flow.dump()
                        // @desc: http://www.slideshare.net/uupaa/flowjs
    this._ = {
        missable: 0,        // Integer: Number of missable. default 0
        waits:  waits,
        state:  PROGRESS,   // String: "progress", "done", "fail", "exit"
        pass:   0,          // Integer: #pass() called
        miss:   0,          // Integer: #miss() called
        args:   [],         // MixArray: #pass(arg), #miss(arg) collections
        tag:    tag || "",
        fn:     callback
    };
    tag && (_progress[tag] = this); // register instance
    _updateState(this);
}

Flow.name = "Flow";
Flow.dump = dump;           // dump():void
Flow.prototype = {
    constructor:Flow,
    missable:   missable,   // #missable(count:Integer):this
    extend:     extend,     // #extend(waits:Integer):this
    pass:       pass,       // #pass(value:Mix = undefined, key:String = ""):this
    miss:       miss,       // #miss(value:Mix = undefined, key:String = ""):this
    exit:       exit        // #exit():void
};

// --- library scope vars ----------------------------------
var PROGRESS = "progress",
    _progress = {}; // keep progress instances

// --- implement -------------------------------------------
function missable(count) { // @arg Integer: missable count
                           // @ret this:
                           // @desc: extend missable count
    this._.missable += count;
    return this;
}

function extend(waits) { // @arg Integer: Number of wait for processes
                         // @ret this:
                         // @desc: extend processes count
    this._.waits += waits;
    return this;
}

function pass(value, // @arg Mix(= undefined): args value
              key) { // @arg String(= ""): args key (optional)
                     // @ret this:
                     // @desc: pass a process
    _increment(this, true, value, key);
    return this;
}

function miss(value, // @arg Mix(= undefined): args value
              key) { // @arg String(= ""): args key (optional)
                     // @ret this:
                     // @desc: miss a process
    _increment(this, false, value, key);
    return this;
}

function _increment(that, pass, value, key) {
    var db = that._;

    pass ? ++db.pass
         : ++db.miss;

    if (value !== void 0) {
        db.args.push(value);
        key && (db.args[key] = value);
    }
    _updateState(that);
}

function _updateState(that) { // @arg this:
                              // @inner: judge state and callback function
    var db = that._;

    if (db.state === PROGRESS) {
        db.state = db.miss > db.missable ? "fail"
                 : db.pass + db.miss >= db.waits ? "done"
                 : db.state;
    }
    if (db.state === PROGRESS || !db.fn) { // progress or already finished
        return;
    }
    if (db.state === "done") {
        db.fn.pass ? db.fn.pass()
                   : db.fn(null, db.args);
    } else { // "fail" or "exit"
        db.fn.miss ? db.fn.miss()
                   : db.fn(new Error(db.state), // err.message: "fail" or "exit"
                           db.args);
    }
    // --- finished ---
    db.fn = null;
    db.args = []; // free
    db.tag && (_progress[db.tag] = null);
}

function exit() { // @desc: exit the Flow
    if (this._.state === PROGRESS) {
        this._.state = "exit";
    }
    _updateState(this);
}

function dump() { // @desc: dump progress instances
    var rv = [], key;

    for (key in _progress) {
        _progress[key] == null ? (delete _progress[key]) // [WEED]
                               : rv.push(JSON.stringify(_progress[key]._, "", 4));
    }
    return rv + "";
}

// --- build -----------------------------------------------

// --- export ----------------------------------------------
if (typeof module !== "undefined") { // is modular
    module.exports = { Flow: Flow };
}
global.Flow = Flow;

})(this.self || global);

