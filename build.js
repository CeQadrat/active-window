const spawn = require('child_process').spawn;
const getConfig = require('./configs').getConfig;

(function build() {
  return new Promise((resolve, reject) => {
    const config = getConfig();
    if (config.build) {
      const { command, args } = config.build;
      const proc = spawn(command, args, {
        env: process.env,
        shell: true,
      });
      proc.stdout.pipe(process.stdout);
      proc.stderr.pipe(process.stderr);
      proc.on('exit', (code, sig) => {
        if (code !== 0) {
          return reject(new Error('Failed to build...'));
        }
        return resolve();
      });
    } else {
      resolve();
    }
  });
})();
