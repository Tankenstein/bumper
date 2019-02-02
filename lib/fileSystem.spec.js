const fs = require('fs');
const { fileExists, readFile, writeFile } = require('./fileSystem');

jest.mock('fs');

describe('File system', () => {
  let mockFiles;

  beforeEach(() => {
    mockFs();
  });

  it('writes files', async () => {
    expect(Object.keys(mockFiles).length).toBe(0);
    await writeFile('some/file', 'text');
    expect(Object.keys(mockFiles).length).toBe(1);
    expect(mockFiles['some/file'].content).toBe('text');
  });

  it('reads files', async () => {
    mockFiles['some/other-file'] = { content: 'some text' };
    const result = await readFile('some/other-file');
    expect(result).toBe('some text');
  });

  it('checks if files exist and are not directories', async () => {
    mockFiles['some-file'] = {
      content: 'text',
      isDirectory: () => false,
    };
    mockFiles['some-directory'] = {
      content: 'text',
      isDirectory: () => true,
    };
    mockFiles['some-failing-file'] = {
      content: 'text',
      isDirectory: () => {
        throw Error('something went wrong');
      },
    };
    expect(await fileExists('some-file')).toBe(true);
    expect(await fileExists('some-directory')).toBe(false);
    expect(await fileExists('some-failing-file')).toBe(false);
  });

  function mockFs() {
    mockFiles = {};
    fs.readFile.mockImplementation((name, encoding, cb) => cb(undefined, mockFiles[name].content));
    fs.writeFile.mockImplementation((name, content, cb) => {
      mockFiles[name] = { content };
      cb();
    });
    fs.stat.mockImplementation((name, cb) => cb(undefined, mockFiles[name]));
  }
});
