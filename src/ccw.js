require('dotenv').config();
const fs = require('fs');
const childProcess = require('child_process');
const { CONSTANTS } = require('./constants');

const CCW_BASE_COMMAND = `node ${CONSTANTS.FILES.CCW} -b ${CONSTANTS.PATHS.SRC} -n ${process.env.OCC_ADMIN_URL} -k ${process.env.OCC_APP_KEY}`;

const Methods = {
    createWidget: () => {
        childProcess.execSync(`${CCW_BASE_COMMAND} -w`, { stdio: 'inherit' });
    },
    createElement: (args) => {
        const path = args[0] ? args[0] : null;
        if(path && !fs.existsSync(path)) {
            console.log(CONSTANTS.COLORS.ERROR, 'No such directory');
            return;
        }
        childProcess.execSync(`${CCW_BASE_COMMAND} -e ${path}`, { stdio: 'inherit' });
    },
    createSiteSettings: () => {
        childProcess.execSync(`${CCW_BASE_COMMAND} -t`, { stdio: 'inherit' });
    },
    createStack: () => {
        childProcess.execSync(`${CCW_BASE_COMMAND} -s`, { stdio: 'inherit' });
    },
};

exports.ccw = Methods;
