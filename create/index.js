#!/usr/bin/env node
/* eslint no-console: off */
const exec = require('exec-sh');
const path = require('path');
const chalk = require('chalk');
const logSymbols = require('log-symbols');
const fse = require('../utils/fs-extra');
const generatePackageJson = require('./utils/generate-package-json');
const generateNpmScripts = require('./utils/generate-npm-scripts');

const createFolders = require('./templates/create-folders');
const copyAssets = require('./templates/copy-assets');
const createCordova = require('./templates/create-cordova');
const createCapacitor = require('./templates/create-capacitor');
const generateReadme = require('./utils/generate-readme');
const generateGitignore = require('./utils/generate-gitignore');
const log = require('../utils/log');

const waitText = chalk.gray('(Please wait, it can take a while)');

module.exports = async (options = {}, logger, { exitOnError = true, iconFile = null } = {}) => {
  const cwd = options.cwd || process.cwd();
  const isRunningInCwd = cwd === process.cwd();
  function errorExit(err) {
    log.error(err.stderr || err);
    if (exitOnError) process.exit(1);
  }
  if (!logger) {
    // eslint-disable-next-line
    logger = {
      statusStart() {},
      statusDone() {},
      statusError() {},
      text() {},
      error() {},
    };
  }

  // Options
  const { type } = options;

  // Package
  logger.statusStart('Generating package.json');
  const packageJson = generatePackageJson(options);

  // Write Package.json and project json
  fse.writeFileSync(path.join(cwd, 'package.json'), packageJson.content);
  fse.writeFileSync(path.join(cwd, 'framework7.json'), JSON.stringify(options, '', 2));

  logger.statusDone('Generating package.json');

  // Create Folders
  logger.statusStart('Creating required folders structure');
  try {
    createFolders(options);
  } catch (err) {
    logger.statusError('Error creating required folders structure');
    if (err) logger.error(err.stderr);
    errorExit(err);
  }
  logger.statusDone('Creating required folders structure');

  // Install NPM depenencies
  logger.statusStart(`${'Installing NPM Dependencies'} ${waitText}`);
  try {
    if (!isRunningInCwd) {
      await exec.promise(`cd ${cwd.replace(/ /g, '\\ ')} && npm install ${packageJson.dependencies.join(' ')} --save`, true);
    } else {
      await exec.promise(`npm install ${packageJson.dependencies.join(' ')} --save`, true);
    }
  } catch (err) {
    logger.statusError('Error installing NPM Dependencies');
    if (err) logger.error(err.stderr);
    errorExit(err);
    return;
  }
  logger.statusDone('Installing NPM Dependencies');

  // Install NPM dev depenencies
  logger.statusStart(`${'Installing NPM Dev Dependencies'} ${waitText}`);
  try {
    if (!isRunningInCwd) {
      await exec.promise(`cd ${cwd.replace(/ /g, '\\ ')} && npm install ${packageJson.devDependencies.join(' ')} --save-dev`, true);
    } else {
      await exec.promise(`npm install ${packageJson.devDependencies.join(' ')} --save-dev`, true);
    }
  } catch (err) {
    logger.statusError('Error installing NPM Dev Dependencies');
    if (err) logger.error(err.stderr);
    errorExit(err);
    return;
  }
  logger.statusDone('Installing NPM Dev Dependencies');

  if (packageJson.postInstall && packageJson.postInstall.length) {
    logger.statusStart('Executing NPM Scripts');
    try {
      if (!isRunningInCwd) {
        await exec.promise(`cd ${cwd.replace(/ /g, '\\ ')} && npm run postinstall`, true);
      } else {
        await exec.promise('npm run postinstall', true);
      }
    } catch (err) {
      logger.statusError('Error executing NPM Scripts');
      if (err) logger.error(err.stderr);
      errorExit(err);
      return;
    }
    logger.statusDone('Executing NPM Scripts');
  }

  // Create Cordova project
  if (type.indexOf('cordova') >= 0) {
    logger.statusStart(`${'Creating Cordova project'} ${waitText}`);
    try {
      await createCordova(options);
    } catch (err) {
      logger.statusError('Error creating Cordova project');
      if (err) logger.error(err.stderr);
      errorExit(err);
      return;
    }
    logger.statusDone('Creating Cordova project');
  }

  // Create Capacitor project
  if (type.indexOf('capacitor') >= 0) {
    logger.statusStart(`${'Creating Capacitor project'} ${waitText}`);
    try {
      await createCapacitor(options);
    } catch (err) {
      logger.statusError('Error creating Capacitor project');
      if (err) logger.error(err.stderr);
      errorExit(err);
      return;
    }
    logger.statusDone('Creating Capacitor project');
  }

  // Create Project Files
  logger.statusStart('Creating project files');
  const filesToCopy = copyAssets(options, iconFile);
  try {
    // eslint-disable-next-line
    await Promise.all(filesToCopy.map((f) => {
      if (f.from) {
        return fse.copyFileAsync(f.from, f.to);
      }
      if (f.content) {
        return fse.writeFileAsync(f.to, f.content);
      }
      return Promise.resolve();
    }));
  } catch (err) {
    logger.statusError('Error creating project files');
    if (err) logger.error(err.stderr || err);
    errorExit(err);
    return;
  }

  // Generate Readme
  const readMeContent = generateReadme(options);
  try {
    fse.writeFileSync(path.join(cwd, 'README.md'), readMeContent);
  } catch (err) {
    logger.statusError('Error creating project files');
    if (err) logger.error(err.stderr || err);
    errorExit(err);
    return;
  }

  // Generate .gitignore
  const gitignoreContent = generateGitignore(options);
  try {
    fse.writeFileSync(path.join(cwd, '.gitignore'), gitignoreContent);
  } catch (err) {
    logger.statusError('Error creating project files');
    if (err) logger.error(err.stderr || err);
    errorExit(err);
    return;
  }

  logger.statusDone('Creating project files');
  const npmScripts = generateNpmScripts(options)
    .map((s) => {
      return `- ${s.icon} Run "npm run ${s.name}" - ${s.description}`;
    });

  // Final Text
  const finalText = `
${chalk.bold(logSymbols.success)} ${chalk.bold('Done!')} 💪

${chalk.bold(logSymbols.info)} ${chalk.bold('Next steps:')}
  ${npmScripts.join('\n  ')}
  - 📖 Visit documentation at ${chalk.bold('https://framework7.io/docs/')}
  - 📖 Check ${chalk.bold('README.md')} in project root folder with further instructions

${chalk.bold('Love Framework7? Support project by donating or pledging on patreon:')}
${chalk.bold('https://patreon.com/vladimirkharlampidi')}
    `;

  logger.text(finalText);
};
