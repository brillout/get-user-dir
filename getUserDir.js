const pathModule = require('path');
const callsites = require('callsites');

module.exports = getUserDir;
module.exports.userDir = null;

function getUserDir() {
    if( module.exports.userDir !== null ) {
        return module.exports.userDir;
    }
    const stacks = callsites();
    for(let i = stacks.length-1; i>=0; i--) {
        const stack = stacks[i];
        if( stack.isNative() ) {
            continue;
        }
        const filePath = stack.getFileName();
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

function isNode(filePath) {
    return !pathModule.isAbsolute(filePath);
}
function isDependency(filePath) {
    return filePath.split(pathModule.sep).includes('node_modules');
}
