require('dotenv').config();
const fs = require('fs');
const extract = require('extract-zip');
const archiver = require('archiver');
const inquirer = require('inquirer');
const FormData = require('form-data');

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

    selector: async type => {
        const choices = type === 'server' ? await Methods.list() : Methods.listLocal();

        if (!choices.length) {
            console.log(`Can't found server side extensions. Please check your ${CONSTANTS.PATHS.SSE} folder or your ${process.env.ACTIVE_ENV} environment.`);
            return false;
        }

        return inquirer.prompt([{
            type: 'search-list',
            name: 'selectedSSE',
            message: 'Select a SSE:',
            choices
        }]);
    },

    list: async env => {
        env = env || process.env.ACTIVE_ENV;

        const token = await auth.login(env);
        const response = await ccAdminApi[env].get(CONSTANTS.ENDPOINT.SSE_LIST, {
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

    listLocal: () => {
        return fs.readdirSync(`${CONSTANTS.PATHS.SSE}`, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
    },

    get: async (sse, isBackup, env) => {
        env = env || process.env.ACTIVE_ENV;
        
        if (sse) {
            sse = sse.indexOf('.zip') !== -1 ? sse : `${sse}.zip`;
            const token = await auth.login(env);

            const response = await ccAdminApi[env].get(`${CONSTANTS.ENDPOINT.SSE_LIST}/${sse}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                responseType: 'stream',
            }).catch(err => {
                if (err.response.status === 404) {
                    if (isBackup) {
                        console.log(`Backup not completed. ${sse} not found in ${env}.`);
                    } else {
                        console.log(`${sse} not found in ${env}.`);
                    }
                }
            });

            if (response && response.data) {
                const date = new Date();
                const timestamp = `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}-${date.toISOString().substr(11, 8).replace(/\:/g, '')}`;
                const writer = fs.createWriteStream(isBackup ? `${CONSTANTS.PATHS.SSE}/BKP-${env}-${timestamp}_${sse}` : `${CONSTANTS.PATHS.SSE}/${sse}`);

                if (!Methods.hasFolder()) {
                    Methods.createFolder();
                }
                
                await new Promise((resolve, reject) => {
                    response.data.pipe(writer);
                    let error = null;
                    writer.on('error', err => {
                        error = err;
                        console.log('Download not completed. Please try again.');
                        writer.close();
                        reject(err);
                    });
                    writer.on('close', async () => {
                        if (!error) {
                            resolve(true);
                        }
                    });
                });
            }          
        } else {
            console.log('SSE required to download.')
        }
    },

    delete: sse => {
        if (sse.indexOf('.zip') !== -1) {
            if (sse) {
                fs.unlinkSync(`${CONSTANTS.PATHS.SSE}/${sse}`);
            } else {
                console.log('SSE required to delete.')
            }
        } else {
            console.log('occ CLI only deletes .zip files.');
        }
    },

    zip: async sse => {
        const archive = archiver('zip', { zlib: { level: 9 }});
        const stream = fs.createWriteStream(`${CONSTANTS.PATHS.SSE}/${sse}.zip`);

        await new Promise((resolve, reject) => {
            archive
                .directory(`${CONSTANTS.PATHS.SSE}/${sse}`, false)
                .on('error', err => reject(err))
                .pipe(stream);

            stream.on('close', () => resolve());
            archive.finalize();
        });
    },

    unzip: async sse => {
        if (sse) {
            await extract(`${CONSTANTS.PATHS.SSE}/${sse}`, { dir: `${process.cwd()}/${CONSTANTS.PATHS.SSE}/${sse.replace('.zip', '')}` });
        } else {
            console.log('SSE required to extract.')
        }
    },

    download: async sse => {
        if (!sse) {
            const { selectedSSE } = await Methods.selector('server');
            sse = selectedSSE;
        }
        
        console.log(`Downloading: ${sse}`);
        await Methods.get(sse);
        
        console.log(`Extracting: ${sse}`);
        await Methods.unzip(sse);
        
        console.log(`Deleting: ${sse}`);
        Methods.delete(sse);
    },

    upload: async (sse, env) => {
        env = env || process.env.ACTIVE_ENV;
        let sseType = sse && sse.indexOf('.zip') !== -1 ? 'zip' : 'folder';

        if (!sse) {
            const { selectedSSE } = await Methods.selector('local');
            sse = selectedSSE;
        }

        if (sse) {
            console.log(`Making a backup copy for ${sse} from ${env}...`);
            await Methods.get(sseType === 'zip' ? sse : `${sse}.zip`, true, env);
    
            if (sseType === 'folder') {
                console.log(`Zipping ${sse}...`);
                await Methods.zip(sse);
                sse = `${sse}.zip`;
                sseType = 'zip';
            }
    
            console.log(`Uploading ${sse} to ${env}, please wait. This may take a while...`);
            const token = await auth.login(env);
            const data = new FormData();
            data.append('fileUpload', fs.createReadStream(`${CONSTANTS.PATHS.SSE}/${sse}`));
            data.append('filename', sse);
            data.append('uploadType', 'extensions');
            data.append('force', 'true');

            const response = await ccAdminApi[env].post(CONSTANTS.ENDPOINT.SSE_UPLOAD, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    ...data.getHeaders(),
                }
            }).catch(err => {
                console.log('SSE UPLOAD ERROR: \n', err.response.data);
            });
    
            Methods.delete(`${sse}`);
        }

    },

    transfer: async (sse, targetEnv) => {
        if (!targetEnv) {
            const { selectedEnv } = await occEnv.selector("Select an environment to transfer:");
            targetEnv = selectedEnv;
        }

        if (targetEnv !== process.env.ACTIVE_ENV) {
            if (occEnv.validate(targetEnv)) {
                if (!sse) {
                    const { selectedSSE } = await Methods.selector('server');
                    sse = selectedSSE;
                }
    
                const { confirm } = await inquirer.prompt([{
                    type: 'confirm',
                    name: 'confirm',
                    message: `Do you want to transfer ${sse} from ${process.env.ACTIVE_ENV} to ${targetEnv}?`,
                }]);

                if (confirm) {
                    console.log(`Downloading ${sse} from ${process.env.ACTIVE_ENV}...`);
                    await Methods.get(sse);
                    await Methods.upload(sse, targetEnv);
                }
                
            } else {
                console.log(`${targetEnv} is not configured.`);
            }
        } else {
            console.log(`Target environment can't be equal to current.`);
        }
    },

};

exports.sse = Methods;