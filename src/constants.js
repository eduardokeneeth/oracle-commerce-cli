exports.CONSTANTS = {
    ENVS: ['TEST', 'STAGE', 'PROD', 'NOENV'],
    COLORS: {
        TITLE: '\x1b[33m\x1b[1m%s\x1b[0m',
        SUCCESS: '\x1b[32m\x1b[1m%s\x1b[0m',
    },
    FILES: {
        DCU_ZIP: './DesignCodeUtility.zip',
        DCU: './DesignCodeUtility/dcuIndex.js',
        CCW: './DesignCodeUtility/ccwIndex.js',
    },
    PATHS: {
        SRC: './src',
        SSE: './sse',
        DCU: './DesignCodeUtility',
    },
    ENDPOINT: {
        LOGIN: '/login',
        SSE_LIST: '/serverExtensions',
        SSE_UPLOAD: '/serverExtensions',
        DCU: '/occs-admin/js/DesignCodeUtility.zip',
    },
}
