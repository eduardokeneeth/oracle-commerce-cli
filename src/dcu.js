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
            async: false
        });
    },

    put: (file) => {
        shell.exec(`${DCU_BASE_COMMAND} -t "${file}"`, {
            async: false,
        });
    },

    refresh: path => {
        shell.exec(`${DCU_BASE_COMMAND} -e "${path.replace(/\/$/g, '')}"`, {
            async: false,
        });
    },
    
    putAll: path => {
        shell.exec(`${DCU_BASE_COMMAND} -m "${path.replace(/\/$/g, '')}"`, {
            async: false,
        });
    },

    transfer: async path => {
        const { selectedEnv } = await occEnv.selector("Select an environment to transfer:");
    
        if (occEnv.validate(selectedEnv)) {
            const { adminUrl, appKey } = occEnv.get(selectedEnv);
            finalShellScript = `node ${CONSTANTS.PATHS.DCU} -b ${CONSTANTS.PATHS.SRC} -n ${adminUrl} -k ${appKey} -x "${path}" -o`;
            shell.exec(finalShellScript, {
                async: false,
            });
        } else {
            console.log(`${selectedEnv} is not configured.`);
        }
    }
};

exports.dcu = Methods;