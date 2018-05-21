const pathModule = require('path');
const callsites = require('callsites');

module.exports = getUserDir;
module.exports.setUserDir = setUserDir;
module.exports.userDir = null;

const globalKey = '__@brillout/get-user-dir__userDir';

function getUserDir() {
    if( global[globalKey] ) {
        return global[globalKey];
    }
    const stacks = callsites();
    for(let i = stacks.length-1; i>=0; i--) {
        const stack = stacks[i];
        if( stack.isNative() ) {
            continue;
        }
        const filePath = stack.getFileName();
        if( ! filePath ) {
            continue;
        }
        if( isNode(filePath) ) {
            continue;
        }
        if( ! isDependency(filePath) ) {
            return pathModule.dirname(filePath);
        }
        break;
    }
    return process.cwd();
}

function setUserDir(userDir) {
    global[globalKey] = userDir;
}

function isNode(filePath) {
    return !pathModule.isAbsolute(filePath);
}
function isDependency(filePath) {
    return filePath.split(pathModule.sep).includes('node_modules');
}
