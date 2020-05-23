const fs = require('fs');
const inquirer = require('inquirer');

const ENVS = ['TEST', 'STAGE', 'PROD', 'NOENV'];

function parseToEnvFile (obj) {
  const keys = Object.keys(obj);
  let file = '';
  keys.forEach(item => {
    file += `
      ${item}=${obj[item]}
    `;
  });
  return file;
}

/**
 * Verify if .env file exists
 * @return {boolean}
 */
exports.hasEnv = () => {
  return fs.existsSync('.env');
}

/**
 * Verify if /src folder exists
 * @return {boolean}
 */
exports.hasSrc = () => {
  return fs.existsSync('./src');
}

exports.createSrc = () => {
  return fs.mkdirSync('./src');
}

/**
 * Display a list of environments
 */
exports.selector = () => {
  return inquirer
    .prompt([
      {
        type: 'list',
        name: 'selectedEnv',
        message: 'Select an environment:',
        choices: ENVS,
      }
    ]);
}

exports.promptEnvInfos = () => {
  return inquirer
    .prompt([
      {
        name: 'adminUrl',
        message: 'Admin URL:',
      },
      {
        name: 'appKey',
        message: 'AppKey:',
      },
    ]);
}

exports.writeEnvFile = keysToUpdate => {
  const envFile = {
    ACTIVE_ENV: process.env.ACTIVE_ENV || '',
    OCC_ADMIN_URL: process.env.OCC_ADMIN_URL || '',
    OCC_APP_KEY: process.env.OCC_APP_KEY || '',
    OCC_TEST_ADMIN_URL: process.env.OCC_TEST_ADMIN_URL || '',
    OCC_TEST_APP_KEY: process.env.OCC_TEST_APP_KEY || '',
    OCC_STAGE_ADMIN_URL: process.env.OCC_STAGE_ADMIN_URL || '',
    OCC_STAGE_APP_KEY: process.env.OCC_STAGE_APP_KEY || '',
    OCC_PROD_ADMIN_URL: process.env.OCC_PROD_ADMIN_URL || '',
    OCC_PROD_APP_KEY: process.env.OCC_PROD_APP_KEY || '',
    OCC_NOENV_ADMIN_URL: process.env.OCC_NOENV_ADMIN_URL || '',
    OCC_NOENV_APP_KEY: process.env.OCC_NOENV_APP_KEY || '',
  };

  if (keysToUpdate) {
    const keys = Object.keys(envFile);
    keys.forEach(item => {
      envFile[item] = keysToUpdate[item] || '';
    });
  }

  fs.writeFileSync('.env', parseToEnvFile(envFile));
}