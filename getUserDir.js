const pathModule = require('path');
const assert = require('@brillout/reassert');

const GLOBAL_KEY = '__@brillout/get-user-dir__userDir';

// We call `getFirstUserLandCall` here because it doesn't work in an event loop
const firstUserLandCall = getFirstUserLandCall();

module.exports = getUserDir;
module.exports.setUserDir = setUserDir;
module.exports.userDir = null;

function getUserDir() {
    if( global[GLOBAL_KEY] ) {
        return global[GLOBAL_KEY];
    }

    const firstCall = firstUserLandCall;
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
        if( isDependency(filePath) ) {
            continue;
        }
        const userDir__tentative = pathModule.dirname(filePath);
        assert.internal(userDir__tentative && pathModule.isAbsolute(userDir__tentative));
        if( isNotUserCode(userDir__tentative, filePath) ) {
            continue;
        }
        const userDir = userDir__tentative;
        return userDir;
    }
    return null;
}
function isNotUserCode(userDir__tentative, filePath) {
  const ProjectFiles = require('@brillout/project-files');
  const {packageJson, projectDir} = (
    new ProjectFiles({
      userDir: userDir__tentative,
      packageJsonIsOptional: true,
    })
  );
  if( !packageJson ) {
    return false;
  }
  assert.internal(packageJson.constructor===Object);
  assert.internal(projectDir);
  if( ((packageJson||{})['@brillout/get-user-dir']||{}).isNotUserCode ){
    return true;
  }
  /*
  if( isBinCall({packageJson, projectDir, filePath}) ) {
    return true;
  }
  */
  const {name} = require('./package.json');
  assert.internal(name);
  if( packageJson.name===name ){
    return true;
  }
  if( packageJson.dependencies[name] ){
    return true;
  }
  return false;
}
/*
function isBinCall({packageJson, projectDir, filePath}) {
  if( !packageJson.bin ){
    return false;
  }
  const p1 = require.resolve(pathModule.resolve(projectDir, packageJson.bin));
  const p2 = require.resolve(filePath);
  return p1===p2;
}
*/
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
