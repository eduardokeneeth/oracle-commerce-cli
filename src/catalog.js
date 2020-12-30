require("dotenv").config();
const fs = require("fs");
const inquirer = require("inquirer");
const { auth } = require("./utils/auth");
const { ccAdminApi } = require("./services/cc-admin");
const { CONSTANTS } = require("./constants");
const { occEnv } = require("./occEnv");

inquirer.registerPrompt("search-list", require("inquirer-search-list"));

const Methods = {
  folderDirectory: (isBackup) => {
    return isBackup
      ? CONSTANTS.PATHS.CATALOG.FOLDER_BACKUP
      : CONSTANTS.PATHS.CATALOG.FOLDER;
  },

  exportAssets: async (env, isBackup) => {
    env = env || process.env.ACTIVE_ENV;
    const token = await auth.login(env);
    const { exportType } = await inquirer.prompt([
      {
        type: "list",
        name: "exportType",
        message: "Select the export type:",
        choices: CONSTANTS.EXPORT_TYPES,
      },
    ]);
    let q;
    let IUCS;
    if (!isBackup) {
      const { IUCSAnswer } = await inquirer.prompt([
        {
          type: "confirm",
          name: "IUCSAnswer",
          message:
            "Do you want to include unassigned categories in the subtree?",
        },
      ]);
      IUCS = IUCSAnswer;

      const { filter } = await inquirer.prompt([
        {
          type: "confirm",
          name: "filter",
          message: "Do you want to use filter?",
        },
      ]);

      if (filter) {
        q = await Methods.formatQuery();
      }
    }

    const response = await ccAdminApi[env]
      .get(`${CONSTANTS.ENDPOINT.ASSET_EXPORT}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          locale: "en",
          timeZoneOffset: new Date().getTimezoneOffset(),
          type: exportType,
          format: "csv",
          includeUnassignedCategoriesSubtree: IUCS,
          // combineWithSCIM: true,
          q: q,
        },
      })
      .catch((err) => {
        console.log("ERROR: ", err);
      });
    const successCalback = () => {
      fs.writeFileSync(
        `${Methods.folderDirectory(isBackup)}/${CONSTANTS.PATHS.CATALOG.FILE}`,
        response.data
      );
    };
    fs.mkdir(Methods.folderDirectory(isBackup), function (err) {
      if (err) {
        const { code } = err;
        if (code === "EEXIST") {
          successCalback();
        } else {
          console.log("ERROR: ", err);
        }
      } else {
        successCalback();
      }
    });
  },

  formatQuery: async () => {
    const { filterType } = await inquirer.prompt([
      {
        type: "list",
        name: "filterType",
        message: "  Choose the attribute that you want to use as filter",
        choices: CONSTANTS.ATTRIBUTE_FILTER,
      },
    ]);

    const { matchType } = await inquirer.prompt([
      {
        type: "list",
        name: "matchType",
        message: "What is the match type?",
        choices: CONSTANTS.QUERY_TYPES,
      },
    ]);
    const { content } = await inquirer.prompt([
      {
        name: "content",
        message: "Please enter the content to be used in the filter:",
      },
    ]);
    return `${filterType} ${matchType} "${content}"`;
  },

  startImportAssets: async () => {
    const file = `${CONSTANTS.PATHS.CATALOG.FOLDER}/${CONSTANTS.PATHS.CATALOG.FILE}`;

    if (!fs.existsSync(file)) {
      console.log("You need to export the data first.");
    } else {
      const { selectedEnv } = await occEnv.selector(
        "Select an environment to transfer:"
      );
      if (occEnv.validate(selectedEnv)) {
        console.log(`Making a backup copy from ${selectedEnv}...`);
        await Methods.exportAssets(selectedEnv, true);

        console.log(
          `Starting import from ${process.env.ACTIVE_ENV} to ${selectedEnv}.`
        );

        const data = fs.readFileSync(file);
        const isImporting = await Methods.importStatus(selectedEnv);
        if (!isImporting) {
          Methods.uploadAssets(data, selectedEnv);
        } else {
          console.log(
            "Oracle commerce cloud instance is already uploading some catalog changes."
          );
        }
      } else {
        console.log(`${selectedEnv} is not configured.`);
      }
    }
  },

  importStatus: async (selectedEnv) => {
    const token = await auth.login(selectedEnv);
    const response = await ccAdminApi[selectedEnv]
      .get(`${CONSTANTS.ENDPOINT.ASSET_STATUS}`, {
        headers: {
          "Content-Type": "application/json",
          "Accept-Encoding": "gzip, deflate, br",
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((err) => {
        console.log("ERROR: ", err.response);
      });

    return response.data.importInProgressStatus;
  },

  uploadAssets: async (data, selectedEnv) => {
    const token = await auth.login(selectedEnv);
    const base64 = data.toString("base64");

    const response = await ccAdminApi[selectedEnv]
      .post(
        `${CONSTANTS.ENDPOINT.ASSET_UPLOAD}`,
        {
          file: base64,
          filename: CONSTANTS.PATHS.CATALOG.FILE,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .catch((err) => {
        console.log("ERROR: ", err.response);
      });

    if (response.data && response.data.token) {
      Methods.validateAssets(selectedEnv, response.data.token);
    } else {
      console.log("Error while validating Assets.");
    }
  },

  validateAssets: async (selectedEnv, uploadToken) => {
    const token = await auth.login(selectedEnv);

    const response = await ccAdminApi[selectedEnv]
      .post(
        `${CONSTANTS.ENDPOINT.ASSET_VALIDATE}`,
        {
          token: uploadToken,
          getValidationResult: "true",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .catch((err) => {
        console.log("ERROR: ", err.response);
      });

    const {
      unchangedCount,
      newCount,
      modifiedCount,
      warningCount,
      errorCount,
      total,
    } = response.data;
    console.log(`Validation summary:
    ${total} Total items
    ${errorCount} Errors (will not be imported)
    ${warningCount} Warnings
    ${newCount} New items
    ${modifiedCount} Modified items
    ${unchangedCount} Unchanged items`);
    const { choice } = await inquirer.prompt([
      {
        type: "confirm",
        name: "choice",
        message: "Do you want to import?",
      },
    ]);
    if (choice) {
      Methods.importAssets(selectedEnv, uploadToken);
    } else {
      console.log("Aborting import function.");
    }
  },

  importAssets: async (selectedEnv, uploadToken) => {
    const token = await auth.login(selectedEnv);

    const response = await ccAdminApi[selectedEnv]
      .post(
        `${CONSTANTS.ENDPOINT.ASSET_IMPORT}`,
        {
          token: uploadToken,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .catch((err) => {
        console.log("ERROR: ", err.response);
      });
    const {
      unchangedCount,
      newSuccessCount,
      modifiedErrorCount,
      modifiedSuccessCount,
      newErrorCount,
      total,
    } = response.data;
    console.log(`Final import summary:
    ${total} Total items
    ${modifiedErrorCount} Modified Errors
    ${newErrorCount} New Product Errors
    ${newSuccessCount} New items
    ${modifiedSuccessCount} Modified items
    ${unchangedCount} Unchanged items`);
  },
};

exports.catalog = Methods;
