#!/usr/bin/env node

const yargs = require('yargs');
const getStdin = require('get-stdin');
const packageJson = require('../package.json');

const { bump } = require('../lib');

yargs
  .scriptName(packageJson.name)
  .help()
  .alias('h', 'help')
  .version(packageJson.version)
  .alias('v', 'version')
  .completion()
  .recommendCommands()
  .wrap(yargs.terminalWidth())
  .command(
    'bump <increment>',
    'The bump command will bump the version in your package.json, package-lock.json and add a CHANGELOG.md entry if those files exist in your current directory.',
    command => {
      command.positional('increment', {
        description: 'Whether to bump the major, minor or patch version',
        choices: ['major', 'minor', 'patch'],
      });
      command.option('title', {
        alias: 't',
        description: 'Title of release',
        type: 'string',
      });
      command.option('description', {
        alias: 'd',
        description: 'Description of release, can be piped from stdin instead',
        type: 'string',
      });
      command.group(['title', 'description'], 'Options for projects with a CHANGELOG.md file:');
    },
    async result => {
      const stdin = await getStdin();
      bump(result.increment, {
        title: result.title,
        description: result.description || stdin,
      });
    },
  )
  .parse();
