require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const extract = require('extract-zip');
const shell = require('shelljs');
const { CONSTANTS } = require('./constants');
const { occEnv } = require('./occEnv');

const DCU_BASE_COMMAND = `node ${CONSTANTS.FILES.DCU} -b ${CONSTANTS.PATHS.SRC} -n ${process.env.OCC_ADMIN_URL} -k ${process.env.OCC_APP_KEY}`;

const Methods =  {

    get: async (env) => {
        env = env || process.env.ACTIVE_ENV;

        const response = await axios.get(`${process.env[`OCC_${env}_ADMIN_URL`]}${CONSTANTS.ENDPOINT.DCU}`, {
            responseType: 'stream',
        }).catch(err => {
            if (err.response.status === 404) {
                console.log(CONSTANTS.COLORS.ERROR, `Design Code Utility not found in ${env}.`);
            } else {
                console.log(CONSTANTS.COLORS.ERROR, `Design Code Utility error in ${env}.`);
            }
        });

        return new Promise((resolve, reject) => {
            if (response && response.data) {
                const writer = fs.createWriteStream(CONSTANTS.FILES.DCU_ZIP);
                response.data.pipe(writer);
                let error = null;
                writer.on('error', err => {
                    error = err;
                    console.log(CONSTANTS.COLORS.ERROR, 'Download not completed. Please try again.');
                    writer.close();
                    reject(err);
                });
                writer.on('close', async () => {
                    if (!error) {
                        resolve(true);
                    }
                });
            }
        });
    },

    download: async () => {
        if (fs.existsSync(CONSTANTS.FILES.DCU_ZIP)) {
            console.log(`Delete: DCU`);
            await Methods.delete();
        }

        console.log(`Downloading: DCU`);
        await Methods.get();

        console.log(`Extracting: DCU`);
        await Methods.unzip();

        console.log(`Install: DCU`);
        await Methods.install();
    },

    unzip: async () => {
        if (fs.existsSync(CONSTANTS.FILES.DCU_ZIP)) {
            await extract(CONSTANTS.FILES.DCU_ZIP, { dir: `${process.cwd()}/${CONSTANTS.PATHS.DCU}` });
        } else {
            console.log(CONSTANTS.COLORS.ERROR, 'DCU required to extract.')
        }
    },

    install: async () => {
        return new Promise((resolve) => {
            shell.cd(CONSTANTS.PATHS.DCU, {
                async: false,
            });
            shell.exec(`npm i`, {
                async: false,
            }, () => {
                fs.chmodSync(process.cwd(), 0o755);
                console.log(CONSTANTS.COLORS.SUCCESS, 'Installed: DCU')
                resolve(true);
            });
        });
    },

    delete: async () => {
        fs.unlinkSync(CONSTANTS.FILES.DCU_ZIP);
        fs.rmdirSync(CONSTANTS.PATHS.DCU, { recursive: true });
    },

    grab: (adminUrl, appKey) => {
        var finalShellScript = `${DCU_BASE_COMMAND} -g -c`;
        if (adminUrl && appKey) {
            finalShellScript = `node ${CONSTANTS.FILES.DCU} -b ${CONSTANTS.PATHS.SRC} -n ${adminUrl} -k ${appKey} -c -g`
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
            const { url, appKey } = occEnv.get(selectedEnv);
            finalShellScript = `node ${CONSTANTS.FILES.DCU} -b ${CONSTANTS.PATHS.SRC} -n ${url} -k ${appKey} -x "${path}" -o`;
            shell.exec(finalShellScript, {
                async: false,
            });
        } else {
            console.log(CONSTANTS.COLORS.ERROR, `${selectedEnv} is not configured.`);
        }
    }
};

exports.dcu = Methods;
