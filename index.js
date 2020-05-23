#!/usr/bin/env node

const program = require('commander');
require('dotenv').config();
const setup = require('./src/setup');

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
