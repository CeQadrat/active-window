require('hazardous');
const fs = require('fs');
const path = require('path');

function getBuildConfigArgs(buildConfig) {
  switch (process.platform) {
    case 'linux':
    case 'linux2':
      return [
        '-g', buildConfig.source,
        '-o', buildConfig.dest,
        ...buildConfig.args
      ];

    case 'darwin':
      return [
        '-o', buildConfig.dest,
        buildConfig.source
      ];

    case 'win32':
      const args = buildConfig.args.map(script => path.join(__dirname, script));
      return [
        ...args,
        buildConfig.source,
        buildConfig.dest,
      ];

    default:
      return buildConfig.args;
  }
}

function appendDirectoryToBuild(config) {
  // in electron 2.0.7, electron-builder 20.26.1 when trying append directory in getConfig method, it refers to the path inside the archive asar. If put it into a separate function, then some magic happens and the path is set to normal
  config.build.source = path.join(__dirname, config.build.source);
  config.build.dest = path.join(__dirname, config.build.dest);
  config.parameters.push(config.build.dest);
  config.build.args = getBuildConfigArgs(config.build);
}

function getConfig() {
  let config = {};
  const configs = JSON.parse(fs.readFileSync(__dirname+'/configs.json', 'utf8'));

  switch (process.platform) {
    case 'linux':
    case 'linux2':
      config = configs.linux;
      break;

    case 'win32':
      config = configs.win32;
      break;

    case 'darwin':
      config = configs.mac;
      break;

    default:
      throw 'Operating System not supported yet. ' + process.platform;
  }
  //Append directory to scripts
  const scriptsUrls = config.scripts.map(script => path.join(__dirname, script));
  config.parameters = [ ...config.parameters, ...scriptsUrls];

  //Append directory to build
  if (config.build) {
    appendDirectoryToBuild(config);
  }

  return config;
}

exports.getConfig = getConfig;
