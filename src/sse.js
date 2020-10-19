require('dotenv').config();
const fs = require('fs');
const inquirer = require('inquirer');
const { auth } = require('./utils/auth');
const { ccAdminApi } = require('./services/cc-admin');
const { CONSTANTS } = require('./constants');
const { occEnv } = require('./occEnv');

inquirer.registerPrompt('search-list', require('inquirer-search-list'));

const Methods = {
    createFolder: () => {
        return fs.mkdirSync(CONSTANTS.PATHS.SSE);
    },

    hasFolder: () => {
        return fs.existsSync(CONSTANTS.PATHS.SSE);
    },

    list: async () => {
        const token = await auth.login();
        const response = await ccAdminApi.get(CONSTANTS.ENDPOINT.SSE_LIST, {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        });

        let serverSideExtensions = response.data ? response.data.items : null;
        serverSideExtensions = serverSideExtensions.map((item) => {
            return item.name;
        });

        return serverSideExtensions;
    },

    download: async (sse) => {
        if (!sse) {
            const { selectedSSE } = await Methods.selector();
            sse = selectedSSE;
        }
        
        console.log(`Downloading: ${sse}`);
        const token = await auth.login();
        const response = await ccAdminApi.get(`${CONSTANTS.ENDPOINT.SSE_LIST}/${sse}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            responseType: 'stream',
        });

        if (!Methods.hasFolder()) {
            Methods.createFolder();
        }

        response.data.pipe(fs.createWriteStream(`${CONSTANTS.PATHS.SSE}/${sse}`));
        console.log(`Download complete!`);
    },

    selector: async () => {
        return inquirer.prompt([{
            type: 'search-list',
            name: 'selectedSSE',
            message: 'Select a SSE to transfer:',
            choices: await Methods.list(),
        }]);
    },
};

exports.sse = Methods;