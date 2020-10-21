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
        return inquirer.prompt([{
            type: 'search-list',
            name: 'selectedSSE',
            message: 'Select a SSE:',
            choices: type === 'server' ? await Methods.list() : Methods.listLocal(),
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

    get: async (sse, env, backup) => {
        env = env || process.env.ACTIVE_ENV;
        if (sse) {
            const token = await auth.login(env);
            const response = await ccAdminApi[env].get(`${CONSTANTS.ENDPOINT.SSE_LIST}/${sse}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                responseType: 'stream',
            });
            
            if (!Methods.hasFolder()) {
                Methods.createFolder();
            }

            const writer = fs.createWriteStream(`${CONSTANTS.PATHS.SSE}/${sse}`);
            
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

            if (backup) {
                const writerBackup =  fs.createWriteStream(`${CONSTANTS.PATHS.SSE}/${env}-${+new Date()}_${sse}`);
                await new Promise((resolve, reject) => {
                    response.data.pipe(writerBackup);
                    let error = null;
                    writerBackup.on('error', err => {
                        error = err;
                        console.log('Backup not completed.');
                        writerBackup.close();
                        reject(err);
                    });
                    writerBackup.on('close', async () => {
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
        if (sse) {
            fs.unlinkSync(`${CONSTANTS.PATHS.SSE}/${sse}`);
        } else {
            console.log('SSE required to delete.')
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

    upload: async sse => {
        if (!sse) {
            const { selectedSSE } = await Methods.selector('local');
            sse = selectedSSE;
        }

        if (sse.indexOf('.zip') === -1) {
            console.log(`Zipping ${sse}...`);
            await Methods.zip(sse);
        }

        const data = new FormData();
        data.append('fileUpload', fs.createReadStream(`${CONSTANTS.PATHS.SSE}/${sse}.zip`));

        console.log(data);

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
                    console.log(`Downloading ${sse} from ${targetEnv}...`);
                    await Methods.get(sse, targetEnv, true);
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