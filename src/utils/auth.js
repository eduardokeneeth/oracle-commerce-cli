require('dotenv').config();
const qs = require('qs');
const { ccAdminApi } = require('./../services/cc-admin');
const { CONSTANTS } = require('./../constants');

const Methods = {
    login: async () => {
        const data = qs.stringify({
            'grant_type': 'client_credentials' 
        });

        const config = {
            headers: {
                ContentType: 'application/x-www-form-urlencoded',
                Authorization: `Bearer ${process.env.OCC_APP_KEY}`,
            },
        };

        const response = await ccAdminApi.post(CONSTANTS.ENDPOINT.LOGIN, data, config);
        const { access_token } = response.data;
        
        return access_token;
    },
};

exports.auth = Methods;