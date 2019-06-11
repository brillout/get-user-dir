const pathModule = require('path');
const assert = require('@brillout/reassert');

const GLOBAL_KEY = '__@brillout/get-user-dir__userDir';

/*
const DEBUG = true;
/*/
const DEBUG = false;
//*/

// We call `getFirstUserLandCall` here because it doesn't work in an event loop
const firstUserLandCall = getFirstUserLandCall();

module.exports = getUserDir;
module.exports.setUserDir = setUserDir;
module.exports.userDir = null;

function getUserDir() {
    if(DEBUG) console.log("globally set", global[GLOBAL_KEY]);
    if( global[GLOBAL_KEY] ) {
        return global[GLOBAL_KEY];
    }

    if(DEBUG) console.log('first user-land call', firstUserLandCall);
    const firstCall = firstUserLandCall;
    if( firstCall ) {
        return firstCall;
    }

    if(DEBUG) console.log('current working directory', process.cwd());
    return process.cwd();
}

function setUserDir(userDir) {
    global[GLOBAL_KEY] = userDir;
}

function getFirstUserLandCall() {
    const stackPaths = getStackPaths();
    if(DEBUG) console.log('stack trace', stackPaths);
    for( let i = 0; i<stackPaths.length; i++ ){
      const filePath = stackPaths[i];
      const is_bin_call = isBinCall(filePath);
      if(DEBUG) console.log('is bin call', filePath, is_bin_call);
      if( is_bin_call ){
        assert.internal(i===0, {filePath, stackPaths});
        return null;
      }
      /*
      const is_not_user_code = isNotUserCode(filePath);
      if(DEBUG) console.log('is not user code', filePath, is_not_user_code);
      if( is_not_user_code ){
        continue;
      }
      */
      const userDir = pathModule.dirname(filePath);
      assert.internal(userDir && pathModule.isAbsolute(userDir));
      return userDir;
    }
    return null;
}

function getStackPaths() {
  const stackPaths = [];
  const calls = getV8StackTrace();
  for( let i = calls.length-1; i>=0; i-- ){
    const call = calls[i];
    if( call.isNative() ){
      continue;
    }
    const filePath = call.getFileName();
    if( ! filePath ){
      continue;
    }
    if( isNode(filePath) ){
      continue;
    }
    if( isDependency(filePath) ){
      continue;
    }
    stackPaths.push(filePath);
  }
  return stackPaths;
}

function isNotUserCode(filePath) {
  const {packageJson, projectDir} = getFileProjectFiles(filePath);

  if( !packageJson ) {
    return false;
  }
  assert.internal(packageJson.constructor===Object);
  assert.internal(projectDir);
  if( ((packageJson||{})['@brillout/get-user-dir']||{}).isNotUserCode ){
    return true;
  }
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
function getFileProjectFiles(filePath) {
  const ProjectFiles = require('@brillout/project-files');

  const fileDir = pathModule.dirname(filePath);
  const {packageJson, projectDir} = (
    new ProjectFiles({
      userDir: fileDir,
      packageJsonIsOptional: true,
    })
  );

  return {packageJson, projectDir};
}
function isBinCall(filePath) {
  const {packageJson, projectDir} = getFileProjectFiles(filePath);

  if( !packageJson.bin ){
    return false;
  }

  const p1 = require.resolve(pathModule.resolve(projectDir, packageJson.bin));
  const p2 = require.resolve(filePath);
  return p1===p2;
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

