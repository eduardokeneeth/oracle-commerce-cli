const fs = require('fs');
const {
  occEnv
} = require('./occEnv');
const dcu = require('./dcu');

const Methods = {
  start: async () => {
    if (!occEnv.hasEnv()) {
      const {
        selectedEnv
      } = await occEnv.selector();
      const {
        adminUrl,
        appKey
      } = await occEnv.promptEnvInfos();

      const envFile = {
        ACTIVE_ENV: selectedEnv,
        OCC_ADMIN_URL: adminUrl,
        OCC_APP_KEY: appKey,
      };
      envFile[`OCC_${selectedEnv}_ADMIN_URL`] = adminUrl;
      envFile[`OCC_${selectedEnv}_APP_KEY`] = appKey;

      occEnv.writeEnvFile(envFile);

      if (!occEnv.hasSrc()) {
        console.log('Creating src folder...');
        occEnv.createSrc();
        console.log('Grabbing your files, please wait.');
        dcu.grab();
      } else {
        console.log('Your project is ready!');
      }
    } else {
      console.log('.env found, delete it and try again.');
    }
  },

  transfer: async (path) => {
    const {
      selectedEnv
    } = await occEnv.selector("Select an environment to transfer:");
    if (occEnv.validate(selectedEnv)) {
      const {
        url,
        appKey
      } = occEnv.get(selectedEnv);
      dcu.transfer(path, url, appKey);
    } else {
      occEnv.set(selectedEnv, );
      dcu.transfer(path, url, appKey);
    }
  }
}

exports.setup = Methods;