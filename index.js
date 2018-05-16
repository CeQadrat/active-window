require('hazardous');
const getConfig = require('./configs').getConfig;

function reponseTreatment(response){
  const window = {};
  if (process.platform === 'win32' || process.platform === 'linux') {
    const data = response
      .split(/(?:@{Id=)|(?:; ProcessName=)|(?:; AppTitle=)|(?:; AppName=)|(?:; Icon=)|(?:; Error=)|(?:})/)
      .slice(1,-1);
    window.pid = data[0];
    window.app = data[1];
    window.title = data[2];
    window.name = data[2] === data[3] ? data[3].split(' - ').pop() : data[3];
    window.icon = data[4];
    window.error = data[5];
  } else if (process.platform === 'darwin') {
    const data = response.split(",");
    window.app = data[0];
    window.title = data[1].replace(/\n$/, "").replace(/^\s/, "");
    window.pid = null; // to complete
  }
  return window;
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
  
    //Run shell script
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
