const pathModule = require('path');
const assert_internal = require('reassert/internal');

const GLOBAL_KEY = '__@brillout/get-user-dir__userDir';


module.exports = getUserDir;
module.exports.setUserDir = setUserDir;
module.exports.userDir = null;


function getUserDir() {
    if( global[GLOBAL_KEY] ) {
        return global[GLOBAL_KEY];
    }

    const firstCall = getFirstUserLandCall();
    if( firstCall ) {
        return firstCall;
    }

    return process.cwd();
}

function setUserDir(userDir) {
    global[GLOBAL_KEY] = userDir;
}

function getFirstUserLandCall() {
    const calls = getV8StackTrace();
    for(let i = calls.length-1; i>=0; i--) {
        const call = calls[i];
        if( call.isNative() ) {
            continue;
        }
        const filePath = call.getFileName();
        if( ! filePath ) {
            continue;
        }
        if( isNode(filePath) ) {
            continue;
        }
        if( ! isDependency(filePath) ) {
            const userDir = pathModule.dirname(filePath);
            assert_internal(userDir && pathModule.isAbsolute(userDir));
            return userDir;
        }
        break;
    }
    return null;
}
function isNode(filePath) {
    return !pathModule.isAbsolute(filePath);
}
function isDependency(filePath) {
    return filePath.split(pathModule.sep).includes('node_modules');
}
function getV8StackTrace() {
    const callsites = require('callsites');

    const stackTraceLimit__original = Error.stackTraceLimit;
    Error.stackTraceLimit = Infinity;
    const calls = callsites();
    Error.stackTraceLimit = stackTraceLimit__original;

    return calls;
}
