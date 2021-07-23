const path = require('path');
const cpy = require('cpy');
const fse = require('../../utils/fs-extra');

module.exports = (options) => {
  const cwd = options.cwd || process.cwd();
  const { pkg, name } = options;
  // eslint-disable-next-line
  return new Promise(async (resolve, reject) => {
    // Write capacitor config file
    const config = {
      appId: pkg,
      appName: name,
      bundledWebRuntime: false,
      npmClient: 'npm',
      webDir: 'www',
      plugins: {
        SplashScreen: {
          launchShowDuration: 0,
        },
      },
      cordova: {},
    };
    fse.writeFileSync(path.resolve(cwd, 'capacitor.config.json'), JSON.stringify(config, '', 2));

    // Create dummy index file
    const content = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
</head>
<body>

</body>
</html>
    `.trim();

    fse.writeFileSync(path.resolve(cwd, 'www/index.html'), content);

    // Upload res files
    try {
      await cpy('**/*.*', path.resolve(cwd, 'resources'), {
        parents: true,
        cwd: path.resolve(__dirname, 'common', 'capacitor-res'),
      });
    } catch (err) {
      reject(err);
      return;
    }

    resolve();
  });
};
