require('dotenv').config();
const fs = require('fs');
const inquirer = require('inquirer');
const {
  auth
} = require('./utils/auth');
const {
  ccAdminApi
} = require('./services/cc-admin');
const {
  CONSTANTS
} = require('./constants');
const {
  occEnv
} = require('./occEnv');

inquirer.registerPrompt('search-list', require('inquirer-search-list'));

const Methods = {
  exportAssets: async (env) => {
    env = env || process.env.ACTIVE_ENV;
    const token = await auth.login(env);
    const response = await ccAdminApi[env].get(`${CONSTANTS.ENDPOINT.ASSET_EXPORT}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        locale: "en",
        timeZoneOffset: new Date().getTimezoneOffset(),
        type: "Product",
        format: "csv",
        combineWithSCIM: true
      }
    }).catch(err => {});
    // console.log("response.data: ", response.data);
    fs.writeFileSync("Products.csv", response.data);
  }
}

exports.catalog = Methods;