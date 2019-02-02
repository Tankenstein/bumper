const bump = require('./bump');
const { exitWithError } = require('./interface');
const { getCommandDirectory, fileExists, readFile, writeFile } = require('./fileSystem');

jest.mock('./fileSystem');
jest.mock('./interface');

describe('Bump command', () => {
  let files;

  beforeEach(() => {
    jest.resetAllMocks();
    mockFileSystem();
    exitWithError.mockImplementation(key => {
      throw new Error(key);
    });
  });

  it('throws if no package.json found', async () => {
    await expect(bump('minor')).rejects.toThrow('Run bumper in a directory with a package.json');
    expect(exitWithError).toHaveBeenCalled();
  });

  it('throws if package.json is malformed', async () => {
    addMockFile('package.json', 'this is not valid json');
    await expect(bump('minor')).rejects.toThrow('The package.json in your directory is malformed');
    expect(exitWithError).toHaveBeenCalled();
  });

  it('throws if package.json has a version not compatible with semver', async () => {
    addMockFile(
      'package.json',
      JSON.stringify({ version: 'this is not a semver-compatible version' }),
    );
    await expect(bump('minor')).rejects.toThrow(
      'The package.json in your directory does not have a semver-compatible version',
    );
    expect(exitWithError).toHaveBeenCalled();
  });

  it('throws if package lock is malformed', async () => {
    addMockFile('package.json', JSON.stringify({ version: '1.0.0' }));
    addMockFile('package-lock.json', 'this is not valid json');

    await expect(bump('minor')).rejects.toThrow(
      'The package-lock.json in your directory is malformed',
    );
    expect(exitWithError).toHaveBeenCalled();
  });

  it('throws if you have a changelog but have not passed a title', async () => {
    addMockFile('package.json', JSON.stringify({ version: '1.0.0' }));
    addMockFile('CHANGELOG.md', 'This is a changelog');

    await expect(bump('minor')).rejects.toThrow(
      'Since this project has a changelog, you must provide a title for your release',
    );
    expect(exitWithError).toHaveBeenCalled();
  });

  it('increments the version and updates your package.json', async () => {
    const writtenVersion = () => JSON.parse(readMockFile('package.json')).version;
    addMockFile('package.json', JSON.stringify({ version: '1.0.0' }));
    await bump('patch');
    expect(writtenVersion()).toBe('1.0.1');
    await bump('minor');
    expect(writtenVersion()).toBe('1.1.0');
    await bump('major');
    expect(writtenVersion()).toBe('2.0.0');
    expect(exitWithError).not.toHaveBeenCalled();
  });

  it('increments the version and updates your package-lock.json if you have that file', async () => {
    const writtenVersion = () => JSON.parse(readMockFile('package-lock.json')).version;
    addMockFile('package.json', JSON.stringify({ version: '1.0.0' }));
    addMockFile('package-lock.json', JSON.stringify({}));
    await bump('patch');
    expect(writtenVersion()).toBe('1.0.1');
    await bump('minor');
    expect(writtenVersion()).toBe('1.1.0');
    await bump('major');
    expect(writtenVersion()).toBe('2.0.0');
    expect(exitWithError).not.toHaveBeenCalled();
  });

  it('adds a new changelog entry if you have that file', async () => {
    addMockFile('package.json', JSON.stringify({ version: '1.0.0' }));
    addMockFile('CHANGELOG.md', '# v1.0.0\n## This is the first version');
    await bump('patch', { title: 'Second version' });
    expect(readMockFile('CHANGELOG.md')).toBe(`# v1.0.1
## Second version

# v1.0.0
## This is the first version`);
    await bump('minor', { title: 'Third version', description: 'With a description this time' });
    expect(readMockFile('CHANGELOG.md')).toBe(`# v1.1.0
## Third version

With a description this time

# v1.0.1
## Second version

# v1.0.0
## This is the first version`);
    expect(exitWithError).not.toHaveBeenCalled();
  });

  function mockFileSystem() {
    files = {};
    getCommandDirectory.mockImplementation(() => 'test-dir');
    fileExists.mockImplementation(async key => !!files[key]);
    readFile.mockImplementation(async key => files[key]);
    writeFile.mockImplementation(async (key, value) => {
      files[key] = value;
    });
  }

  function addMockFile(file, contents) {
    files[`test-dir/${file}`] = contents;
  }

  function readMockFile(file) {
    return files[`test-dir/${file}`];
  }
});
