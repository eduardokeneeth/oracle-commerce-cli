const { occEnv } = require('./occEnv');
const { dcu } = require('./dcu');
const { CONSTANTS } = require('./constants');

const Methods = {
  start: async () => {
    if (!occEnv.hasEnv()) {
      var { selectedEnv } = await occEnv.selector();
      var { adminUrl, appKey } = await occEnv.promptEnvInfos();

      const envFile = {
        ACTIVE_ENV: selectedEnv,
        OCC_ADMIN_URL: adminUrl,
        OCC_APP_KEY: appKey,
      };
      envFile[`OCC_${selectedEnv}_ADMIN_URL`] = adminUrl;
      envFile[`OCC_${selectedEnv}_APP_KEY`] = appKey;

      occEnv.writeEnvFile(envFile);

      if (!occEnv.hasDCU()) {
        console.log(CONSTANTS.COLORS.TITLE, 'Download DCU...');
        await dcu.download();
      }

      // if (!occEnv.hasSrc()) {
        console.log(CONSTANTS.COLORS.TITLE, 'Creating src folder...');
        occEnv.createSrc();
        console.log(CONSTANTS.COLORS.TITLE, 'Grabbing your files, please wait.');
        dcu.grab(adminUrl, appKey);
      // } else {
        console.log(CONSTANTS.COLORS.SUCCESS, 'Your project is ready!');
      // }
    } else {

      // if (!occEnv.hasDCU()) {
        console.log(CONSTANTS.COLORS.TITLE, 'Download DCU...');
        await dcu.download();
      // }

      console.log('.env found, delete it and try again.');
    }
  }
}

exports.setup = Methods;
