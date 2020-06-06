require('dotenv').config();
const fs = require('fs');
const inquirer = require('inquirer');
const { CONSTANTS } = require('./constants');

const Methods = {
  parseToEnvFile: obj => {
    const keys = Object.keys(obj);
    let file = '';
    keys.forEach(item => {
      file += `
        ${item}=${obj[item]}
      `;
    });
    return file;
  },

  hasEnv: () => {
    return fs.existsSync('.env');
  },

  hasSrc: () => {
    return fs.existsSync('./src');
  },

  createSrc: () => {
    return fs.mkdirSync('./src');
  },

  selector: message => {
    return inquirer
      .prompt([{
        type: 'list',
        name: 'selectedEnv',
        message: message || 'Select an environment:',
        choices: CONSTANTS.ENVS,
      }]);
  },

  promptEnvInfos: () => {
    return inquirer
      .prompt([{
          name: 'adminUrl',
          message: 'Admin URL:',
        },
        {
          name: 'appKey',
          message: 'AppKey:',
        },
      ]);
  },

  set: (environment, adminUrl, appKey) => {
    const obj = {};
    obj[`OCC_${environment}_ADMIN_URL`] = adminUrl;
    obj[`OCC_${environment}_APP_KEY`] = appKey;

    if (environment === process.env.ACTIVE_ENV) {
      obj.OCC_ADMIN_URL = adminUrl;
      obj.OCC_APP_KEY = appKey;
    }
    Methods.writeEnvFile(obj);
  },

  get: environment => {
    return {
      env: environment || process.env.ACTIVE_ENV,
      url: environment ?
        process.env[`OCC_${environment}_ADMIN_URL`] : process.env.OCC_ADMIN_URL,
      appKey: environment ?
        process.env[`OCC_${environment}_APP_KEY`] : process.env.OCC_APP_KEY,
    };
  },

  change: async environment => {
    if (!environment) {
      var { selectedEnv } = await Methods.selector();
      environment = selectedEnv;
    }
    
    if (Methods.validate(environment)) {
      Methods.writeEnvFile({
        ACTIVE_ENV: environment,
        OCC_ADMIN_URL: process.env[`OCC_${environment}_ADMIN_URL`],
        OCC_APP_KEY: process.env[`OCC_${environment}_APP_KEY`],
      });
    } else {
      console.log('This environment is not configured.');
    }
  },

  config: async () => {
    const { selectedEnv } = await Methods.selector();
    if (Methods.validate(selectedEnv)) {
      const { needToUpdate } = await inquirer.prompt({
        type: 'confirm',
        name: 'needToUpdate',
        message: `${selectedEnv} is ready. Do you want to update?`,
      });
      if (needToUpdate) {
        const { adminUrl, appKey } = await Methods.promptEnvInfos();
        Methods.set(selectedEnv, adminUrl, appKey);
      }
    } else {
      const { adminUrl, appKey } = await Methods.promptEnvInfos();
      Methods.set(selectedEnv, adminUrl, appKey);
    }
  },

  validate: environment => {
    if (Methods.hasEnv()) {
      if (environment) {
        return (
          process.env[`OCC_${environment}_ADMIN_URL`].length > 0 &&
          process.env[`OCC_${environment}_APP_KEY`].length > 0
        );
      } else {
        return (
          process.env.OCC_ADMIN_URL.length > 0 &&
          process.env.OCC_APP_KEY.length > 0
        );
      }
    } else {
      return false;
    }
  },

  writeEnvFile: keysToUpdate => {
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
        envFile[item] = keysToUpdate[item] ? keysToUpdate[item] : process.env[item] || '';
      });
    }

    fs.writeFileSync('.env', Methods.parseToEnvFile(envFile));
  }
}

exports.occEnv = Methods;