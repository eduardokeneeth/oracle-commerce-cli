require('dotenv').config();
const shell = require('shelljs');
const { CONSTANTS } = require('./constants');
const { occEnv } = require('./occEnv');

const DCU_BASE_COMMAND = `node ${CONSTANTS.PATHS.DCU} -b ${CONSTANTS.PATHS.SRC} -n ${process.env.OCC_ADMIN_URL} -k ${process.env.OCC_APP_KEY}`;

const Methods =  {
    grab: (adminUrl, appKey) => {
        var finalShellScript = `${DCU_BASE_COMMAND} -g -c`;
        if (adminUrl && appKey) {
            finalShellScript = `node ${CONSTANTS.PATHS.DCU} -b ${CONSTANTS.PATHS.SRC} -n ${adminUrl} -k ${appKey} -c -g`
        }
        shell.exec(finalShellScript, {
            async: true
        });
    },

    put: (file) => {
        shell.exec(`${DCU_BASE_COMMAND} -t "${file}"`);
    },

    refresh: path => {
        shell.exec(`${DCU_BASE_COMMAND} -e "${path.replace(/\/$/g, '')}"`, {
            async: true,
        });
    },
    
    putAll: path => {
        shell.exec(`${DCU_BASE_COMMAND} -m "${path.replace(/\/$/g, '')}"`);
    },

    transfer: async path => {
        const { selectedEnv } = await occEnv.selector("Select an environment to transfer:");
    
        if (occEnv.validate(selectedEnv)) {
            const { url, appKey } = occEnv.get(selectedEnv);
            finalShellScript = `npm run dcu -- -b ${CONSTANTS.PATHS.SRC} -n ${url} -k ${appKey} -x "${path}" -o`;
            shell.exec(finalShellScript, { async: true });
        } else {
            console.log(`${selectedEnv} is not configured.`);
        }
    }
};

exports.dcu = Methods;