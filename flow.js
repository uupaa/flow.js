// Flow.js: asynchronous processes flow pattern
this.Flow || (function(global) {

// --- header ----------------------------------------------
function Flow(waits,    // @arg Integer: Number of wait for processes
              callback, // @arg Function/FunctionHash/Flow/FlowHash: callback and forks
                        //         callback on completion of processes.
                        //         callback(err:Error, args:MixArray)
              tag) {    // @arg String(= ""): tag name for Flow.dump()
                        // @desc: http://www.slideshare.net/uupaa/flowjs
    this._ = {
        missable: 0,        // Integer: Number of missable. default 0
        reason: "",         // String: exit or miss reason.
        waits:  waits,
        state:  PROGRESS,   // String: "progress", "done", "fail", "exit"
        name:   "",         // String: #fork(name)
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
Flow.dump = dump;           // dump(clear:Boolean = false):void
Flow.prototype = {
    constructor:Flow,
    missable:   missable,   // #missable(count:Integer):this
    extend:     extend,     // #extend(waits:Integer):this
    pass:       pass,       // #pass(value:Mix = undefined, key:String = ""):this
    miss:       miss,       // #miss(value:Mix = undefined, key:String = "", reason:String = "fail"):this
    fork:       fork,       // #fork(name:String = ""):this
    exit:       exit        // #exit(reason:String = "exit"):void
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
    ++this._.pass;
    if (value !== void 0) {
        this._.args.push(value);
        key && (this._.args[key] = value);
    }
    _updateState(this);
    return this;
}

function miss(value,    // @arg Mix(= undefined): args value
              key,      // @arg String(= ""): args key (optional)
              reason) { // @arg String(= "fail"): miss reason
                        // @ret this:
                        // @desc: miss a process
    ++this._.miss;
    if (value !== void 0) {
        this._.args.push(value);
        key && (this._.args[key] = value);
        this._.reason = reason || "fail"; // set reason
    }
    _updateState(this);
    return this;
}

function _updateState(that) { // @arg this:
                              // @inner: judge state and callback function
    var db = that._, fn;

    if (db.state === PROGRESS) {
        db.state = db.miss > db.missable ? "fail"
                 : db.pass + db.miss >= db.waits ? "done"
                 : db.state;
    }
    if (db.state === PROGRESS || !db.fn) { // progress or already finished
        return;
    }
    fn = _detectCallback(db.fn, db.name);
    if (db.state === "done") {
        fn.pass ? fn.pass(db.args)  // junction
                : fn(null, db.args);
    } else {
        fn.miss ? fn.miss(db.args)  // junction
                : fn(new Error(db.reason), db.args); // err.message = reason
    }
    // --- finished ---
    db.fn = null;
    db.args = []; // free
    db.tag && (_progress[db.tag] = null);
}

function _detectCallback(fn, name) {
    return ( fn.pass || typeof fn === "function" ) // Flow or Function ?
           ? fn
           : fn[name || Object.keys(fn)[0]];       // FlowHash or FunctionHash
}

function exit(reason) { // @arg String(= "exit"): exit reason
                        // @desc: exit the Flow
    if (this._.state === PROGRESS) {
        this._.state = "exit";
        this._.reason = reason || "exit";
    }
    _updateState(this);
}

function fork(name) { // @arg String(= ""): fork name. "" is first function
                      // @ret this:
    this._.name = name || "";
    return this;
}

function dump(clear) { // @arg Boolean(= false): detach all progress instances
                       // @desc: dump progress instances
    var rv = [], key;

    for (key in _progress) {
        _progress[key] == null ? (delete _progress[key]) // [WEED]
                               : rv.push(JSON.stringify(_progress[key]._, "", 4));
    }
    clear && (_progress = {});
    return rv + "";
}

// --- build -----------------------------------------------

// --- export ----------------------------------------------
if (typeof module !== "undefined") {
    module.exports = { Flow: Flow };
}
global.Flow = Flow;

})(this.self || global);

