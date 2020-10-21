require('dotenv').config();
const qs = require('qs');
const { ccAdminApi } = require('./../services/cc-admin');
const { CONSTANTS } = require('./../constants');

const Methods = {
    login: async env => {
        env = env || process.env.ACTIVE_ENV;

        const data = qs.stringify({
            'grant_type': 'client_credentials' 
        });

        const config = {
            headers: {
                ContentType: 'application/x-www-form-urlencoded',
                Authorization: `Bearer ${process.env[`OCC_${env}_APP_KEY`]}`,
            },
        };

        try {
            const response = await ccAdminApi[env].post(CONSTANTS.ENDPOINT.LOGIN, data, config);
            const { access_token } = response.data;
            return access_token;
        } catch (e) {
            console.log(`Not authorized to access ${env}. Please review your environment configuration.`);
        }
    },
};

exports.auth = Methods;