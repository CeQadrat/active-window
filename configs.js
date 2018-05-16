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

    default:
      return buildConfig.args;
  }
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
    config.build.source = path.join(__dirname, config.build.source);
    config.build.dest = path.join(__dirname, config.build.dest);
    config.parameters.push(config.build.dest);
    config.build.args = getBuildConfigArgs(config.build);
  }

  //Append directory to subscript url on OSX
  if (process.platform === 'darwin') {
    config.parameters.push(path.join(__dirname, config.subscript_url));
  }

  return config;
}

exports.getConfig = getConfig;
