exports.CONSTANTS = {
    ENVS: ['TEST', 'STAGE', 'PROD', 'NOENV'],
    PATHS: {
        SRC: './src',
        SSE: './sse',
        CATALOG: {
            FOLDER: "./catalog",
            FOLDER_BACKUP: "./catalog-backup",
            FILE: "Products.csv",
        },
        DCU: './DesignCodeUtility/dcuIndex.js',
        CCW: './DesignCodeUtility/ccwIndex.js',
    },
    EXPORT_TYPES: [{
        name: "Products",
        value: "Product"
    }, {
        name: "Product Variants (SKUs)",
        value: "Variant"
    }, {
        name: "Collections",
        value: "Collection"
    }, {
        name: "Catalogs",
        value: "catalog"
    }],
    QUERY_TYPES: [{
            name: "==",
            value: "EQ"
        }, {
            name: "!==",
            value: "NE"
        },
        {
            name: "Starts with",
            value: "SW"
        },
        {
            name: "Contains",
            value: "CO"
        }
    ],
    ATTRIBUTE_FILTER: [{
            name: "Name",
            value: "displayName"
        }, {
            name: "Product ID",
            value: "id"
        }
    ],
    ENDPOINT: {
        ASSET_EXPORT: '/asset/export',
        ASSET_IMPORT: '/asset/import',
        ASSET_STATUS: '/asset/importStatus',
        ASSET_UPLOAD: '/asset/upload',
        ASSET_VALIDATE: '/asset/validate',
        LOGIN: '/login',
        SSE_LIST: '/serverExtensions',
        SSE_UPLOAD: '/serverExtensions',
    }
}