require('dotenv').config();
// const shell = require('shelljs');
const browserSync = require('browser-sync').create();
const chokidar = require('chokidar');
const { CONSTANTS } = require('./constants');
const { dcu } = require('./dcu');

const Methods = {
  start: () => {
    Methods.startBrowserSync();
    Methods.watchLess();
    Methods.watchJs();
    Methods.watchHtml();
    Methods.watchJson();
  },

  fixPath: (path = '') => {
    const newPath = path.replace(/\\/g, '/');
    return newPath;
  },

  watchLess: () => {
    const watcher = chokidar.watch([`${CONSTANTS.PATHS.SRC}/**/*.less`]);
    watcher.on('change', file => {
      console.log(`A change was detected, uploading: ${file}`);
      dcu.put(Methods.fixPath(file));
      browserSync.reload();
    });
  },

  watchJs: () => {
    const watcher = chokidar.watch([`${CONSTANTS.PATHS.SRC}/**/*.js`]);
    watcher.on('change', file => {
      console.log(`A change was detected, uploading: ${file}`);
      if (Methods.fixPath(file).indexOf('/module/') !== -1) {
        dcu.putAll(Methods.fixPath(file).split('/js/')[0]);
      } else {
        dcu.put(Methods.fixPath(file));
      }
      browserSync.reload();
    });
  },

  watchHtml: () => {
    const watcher = chokidar.watch([`${CONSTANTS.PATHS.SRC}/**/*.template`]);
    watcher.on('change', file => {
      console.log(`A change was detected, uploading: ${file}`);
      dcu.put(Methods.fixPath(file));
      browserSync.reload();
    });
  },

  watchJson: () => {
    const watcher = chokidar.watch([`${CONSTANTS.PATHS.SRC}/**/*.json`]);
    watcher.on('change', file => {
      console.log(`A change was detected, uploading: ${file}`);
      dcu.put(Methods.fixPath(file));
      browserSync.reload();
    });
  },

  startBrowserSync: () => {
    const bsPort = 3000;
    const browserSyncConfig = {
      https: true,
      socket: {
        domain: `localhost:${bsPort}`,
      },
      port: bsPort,
      callbacks: {
        ready: function(err, bs) {
            console.log('Watching for changes...');
        }
      }
    };
    browserSync.init(browserSyncConfig);
  }

};

exports.dev = Methods;