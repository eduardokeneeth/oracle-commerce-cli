require('dotenv').config();
const childProcess = require('child_process');
const { CONSTANTS } = require('./constants');

const CCW_BASE_COMMAND = `node ${CONSTANTS.PATHS.CCW} -b ${CONSTANTS.PATHS.SRC} -n ${process.env.OCC_ADMIN_URL} -k ${process.env.OCC_APP_KEY}`;

const Methods = {
    createWidget: () => {
        childProcess.execSync(`${CCW_BASE_COMMAND} -w`, { stdio: 'inherit' });
    },
    createElement: () => {
        childProcess.execSync(`${CCW_BASE_COMMAND} -e`, { stdio: 'inherit' });
    },
};

exports.ccw = Methods;
