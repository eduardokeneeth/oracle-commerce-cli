const shell = require('shelljs');
const { CONSTANTS } = require('./constants')

const DCU_BASE_COMMAND = `npm run dcu -- -b ${CONSTANTS.PATHS.SRC} -n ${process.env.OCC_ADMIN_URL} -k ${process.env.OCC_APP_KEY}`

exports.grab = () => {
    shell.exec(`${DCU_BASE_COMMAND} -c -g`, { async: true });
}