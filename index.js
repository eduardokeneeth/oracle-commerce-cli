#!/usr/bin/env node

require('dotenv').config();
const program = require('commander');
const { setup } = require('./src/setup');
const { occEnv } = require('./src/occEnv');

program
  .version('0.0.1')
  .description('An application to help you with your daily OCC commands.')
  .option('-s, --start', 'Start the environment setup')
  .option('-d, --dev', 'Start watcher + Browsersync')
  .option('-c, --create <type>', 'Create widget or element')
  .option('-r, --refresh <path>', 'Refresh path')
  .option('-p, --putAll <path>', 'Upload the entire path')
  .option('-e, --env <operation>', 'Start the environment manager')
  .parse(process.argv);

if (program.start) {
  setup.start();
}

if (program.env) {
  switch (program.env) {
    case 'config':
      occEnv.config();
      break;
    case 'change':
      occEnv.change();
      break;
    case 'current':
      const { env, url, appKey} = occEnv.get();
      console.log(`Environment: ${env}\nURL: ${url}\nKEY: ${appKey}`);
      break;
  }
}