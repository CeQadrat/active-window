require('hazardous');
const fs = require('fs');
const path = require('path');

function reponseTreatment(response){
  let window = {};
  if (process.platform === 'linux') {
    response = response.replace(/(WM_CLASS|WM_NAME)(\(\w+\)\s=\s)/g,'').match(/"[^"]*"/g).map(str => str.slice(1, -1));
    window.app = response[1] || response[0];
    window.title = response[2];
    window.pid = null; // to complete
  } else if (process.platform === 'win32'){
    response = response
      .split(/(?:@{Id=)|(?:; ProcessName=)|(?:; AppTitle=)|(?:; AppName=)|(?:; Icon=)|(?:; Error=)|(?:})/)
      .slice(1,-1);
    window.pid = response[0];
    window.app = response[1];
    window.title = response[2];
    window.name = response[3];
    window.icon = response[4];
    window.error = response[5];
  } else if (process.platform === 'darwin') {
    response = response.split(",");
    window.app = response[0];
    window.title = response[1].replace(/\n$/, "").replace(/^\s/, "");
    window.pid = null; // to complete
  }
  return window;
}

/**
* Get script config accordingly the operating system
* @function getConfig
*/
function getConfig(){
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

  //Append directory to modules
  if (process.platform === 'win32') {
    const moduleUrl = path.join(__dirname, config.module);
    config.parameters.push(moduleUrl);
  }

  //Append directory to subscript url on OSX
  if (process.platform === 'darwin') {
    config.parameters.push(path.join(__dirname, config.subscript_url));
  }

  return config;
}

class ActiveWindowTracker { 
  constructor() {
    this.listeners = [];
    this.currentWindow = {};
    this._process = null;
  }

  isRunning() {
    return this._process !== null;
  }

  registerListener(listener) {
    this.listeners.push(listener);
  }

  start(interval = 1) {
    if (this.isRunning()) {
      throw new Error('Tracking has been already started.');
    }

    const spawn = require('child_process').spawn;
    let repeats = -1;
  
    //Scape negative number of repeats on Windows OS
    if (process.platform === 'win32' && repeats < 0) {
      repeats = '\\-1';
    }

    const config = getConfig();
    const { parameters }  = config;
    parameters.push(repeats);
    parameters.push(interval);
    // parameters.push(path.join(__dirname, ));
  
    //Run shell script
    console.log(parameters);
    this._process  = spawn(config.bin, parameters);
    this._process.stdout.setEncoding('utf8');
  
    //Obtain successful response from script
    this._process.stdout.on('data', (stdout) => {
      const result = reponseTreatment(stdout.toString());
      if (result.app && this.currentWindow.app !== result.app) {
        this.listeners.forEach(listener => listener(result));
        this.currentWindow = result;
      }
    });
  
    //Obtain error response from script
    this._process.stderr.on('data', function(stderr) {
      throw stderr.toString();
    });
  
    this._process.stdin.end();
  }

  stop() {
    if (!this.isRunning()) {
      throw new Error('Tracking hasn\'t been started yet');
    }
    this._process.kill();
    this._process = null;
    this.currentWindow = {};
  }
}

exports.ActiveWindowTracker = ActiveWindowTracker;
