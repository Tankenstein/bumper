const chalk = require('chalk');

const ifTTY = fn => (process.stdout.isTTY ? fn : () => {});

const colors = {
  red: ifTTY(chalk.red),
  green: ifTTY(chalk.green),
};

function exitWithError(message) {
  if (message) {
    log(colors.red(message));
  }
  process.exit(1);
}

function log(...args) {
  // eslint-disable-next-line no-console
  console.log(...args);
}

module.exports = { exitWithError, log, colors };
