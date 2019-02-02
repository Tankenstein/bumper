const semver = require('semver');

const { exitWithError, log, colors } = require('./interface');
const { getCommandDirectory, fileExists, readFile, writeFile } = require('./fileSystem');

function bump(increment, options) {
  return new VersionBump(increment, options).run();
}

// TODO: move all the strings to a separate file, so we can mock them in the tests

class VersionBump {
  constructor(increment, options = {}) {
    this.increment = increment.toLowerCase();
    this.options = options;

    this.hasChangelog = false;
    this.hasLock = false;
    this.filePaths = getPaths();

    this.packageContents = null;
    this.lockContents = null;
    this.changelogContents = null;
  }

  async run() {
    await this.loadAndValidateProject();
    const { name, version } = this.packageContents;
    this.newVersion = semver.inc(version, this.increment);
    log(`Bumping ${name} from ${colors.red(version)} -> ${colors.green(this.newVersion)}`);
    await Promise.all([this.writeNewPackage(), this.writeNewLock(), this.writeNewChangelog()]);
    log(colors.green('Done'));
  }

  writeNewPackage() {
    log(`Bumping package version`);
    this.packageContents.version = this.newVersion;
    return writeFile(this.filePaths.package, JSON.stringify(this.packageContents, undefined, 2));
  }

  async writeNewLock() {
    if (this.hasLock) {
      log(`Bumping package lock version`);
      this.lockContents.version = this.newVersion;
      return writeFile(this.filePaths.lock, JSON.stringify(this.lockContents, undefined, 2));
    }
    return null;
  }

  async writeNewChangelog() {
    if (this.hasChangelog) {
      const { title, description } = this.options;
      log(`Adding new changelog entry`);
      const newEntry = `# v${this.newVersion}\n## ${title}\n${
        description ? `\n${description.trim()}\n` : ''
      }\n`;
      return writeFile(this.filePaths.changelog, newEntry + this.changelogContents);
    }
    return null;
  }

  async loadAndValidateProject() {
    const [packageExists, changelogExists, lockExists] = await Promise.all([
      fileExists(this.filePaths.package),
      fileExists(this.filePaths.changelog),
      fileExists(this.filePaths.lock),
    ]);
    this.hasChangelog = changelogExists;
    this.hasLock = lockExists;

    if (!packageExists) {
      return exitWithError('Run bumper in a directory with a package.json');
    }

    return Promise.all([
      this.loadAndValidatePackage(),
      this.loadAndValidateLock(),
      this.loadAndValidateChangelog(),
    ]);
  }

  async loadAndValidatePackage() {
    const packageFile = await readFile(this.filePaths.package);
    let parsedPackage;
    try {
      parsedPackage = JSON.parse(packageFile);
    } catch (e) {
      exitWithError('The package.json in your directory is malformed');
    }

    const { version } = parsedPackage;
    if (!version || !semver.valid(version)) {
      return exitWithError(
        'The package.json in your directory does not have a semver-compatible version',
      );
    }

    this.packageContents = parsedPackage;
    return true;
  }

  async loadAndValidateLock() {
    if (this.hasLock) {
      const lockFile = await readFile(this.filePaths.lock);
      try {
        const parsedLock = JSON.parse(lockFile);
        this.lockContents = parsedLock;
      } catch (e) {
        exitWithError('The package-lock.json in your directory is malformed');
      }
    }
    return true;
  }

  async loadAndValidateChangelog() {
    if (this.hasChangelog) {
      if (!this.options.title) {
        return exitWithError(
          'Since this project has a changelog, you must provide a title for your release',
        );
      }

      this.changelogContents = await readFile(this.filePaths.changelog);
    }

    return true;
  }
}

function getPaths() {
  const currentDirectory = getCommandDirectory();
  return {
    package: `${currentDirectory}/package.json`,
    lock: `${currentDirectory}/package-lock.json`,
    changelog: `${currentDirectory}/CHANGELOG.md`,
  };
}

module.exports = bump;
