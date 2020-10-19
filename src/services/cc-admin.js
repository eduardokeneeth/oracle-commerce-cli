require('dotenv').config();
const axios = require('axios');

const api = axios.create({
    baseURL: `${process.env.OCC_ADMIN_URL}/ccadmin/v1`,
});

exports.ccAdminApi = api;