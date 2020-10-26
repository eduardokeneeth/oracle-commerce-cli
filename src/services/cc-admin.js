require('dotenv').config();
const axios = require('axios');

const TEST = axios.create({
    baseURL: `${process.env.OCC_TEST_ADMIN_URL}/ccadmin/v1`,
});

const STAGE = axios.create({
    baseURL: `${process.env.OCC_STAGE_ADMIN_URL}/ccadmin/v1`,
});

const PROD = axios.create({
    baseURL: `${process.env.OCC_PROD_ADMIN_URL}/ccadmin/v1`,
});

const NOENV = axios.create({
    baseURL: `${process.env.OCC_NOENV_ADMIN_URL}/ccadmin/v1`,
});

exports.ccAdminApi = {
    TEST,
    STAGE,
    PROD,
    NOENV,
};