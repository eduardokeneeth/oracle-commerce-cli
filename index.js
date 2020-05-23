#!/usr/bin/env node

require('dotenv').config();
const program = require('commander');
const { setup } = require('./src/setup');
const { occEnv } = require('./src/occEnv');
const { dcu } = require('./src/dcu');

program
  .version('0.0.1')
  .description('An application to help you with your daily OCC commands.')
  .option('-s, --start', 'Start the environment setup')
  .option('-d, --dev', 'Start watcher + Browsersync')
  .option('-c, --create <type>', 'Create widget or element')
  .option('-r, --refresh <path>', 'Refresh path')
  .option('-p, --putAll <path>', 'Upload the entire path')
  .option('-e, --env <operation>', 'Start the environment manager')
  .option('-t, --transfer <path>', 'Transfer all widgets between 2 environments')
  .parse(process.argv);

if (program.start) {
  setup.start();
}

if (program.refresh) {
  dcu.refresh(program.refresh);
}

if (program.putAll) {
  dcu.putAll(program.putAll);
}

if (program.transfer) {
  dcu.transfer(program.transfer);
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
      const {
        env, url, appKey
      } = occEnv.get();
      console.log(`Environment: ${env}\nURL: ${url}\nKEY: ${appKey}`);
      break;
  }
}