const exec = require('exec-sh');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

async function release() {
  const options = await inquirer.prompt([
    {
      type: 'input',
      name: 'version',
      message: 'Version:',
      default: pkg.version,
    },
    {
      type: 'list',
      name: 'beta',
      message: 'Beta?',
      when: (opts) => opts.version.indexOf('beta') >= 0,
      choices: [
        {
          name: 'YES',
          value: true,
        },
        {
          name: 'NO',
          value: false,
        },
      ],
    },
  ]);
  pkg.version = options.version;

  fs.writeFileSync(path.resolve(__dirname, '../package.json'), JSON.stringify(pkg, null, 2));

  await exec.promise('git pull');
  await exec.promise('npm i');
  await exec.promise('git add .');
  await exec.promise(`git commit -m ${pkg.version}`);
  await exec.promise('git push');
  await exec.promise(`git tag v${pkg.version}`);
  await exec.promise('git push origin --tags');
  if (options.beta) {
    await exec.promise('npm publish --tag next');
  } else {
    await exec.promise('npm publish');
  }
}

release();
