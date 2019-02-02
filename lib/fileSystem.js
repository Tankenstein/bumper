const fs = require('fs');
const { promisify } = require('util');

function getCommandDirectory() {
  return process.cwd();
}

async function fileExists(fileName) {
  try {
    const stat = await promisify(fs.stat)(fileName);
    return stat && !stat.isDirectory();
  } catch (e) {
    return false;
  }
}

function readFile(fileName) {
  return promisify(fs.readFile)(fileName, 'UTF-8');
}

function writeFile(fileName, data) {
  return promisify(fs.writeFile)(fileName, data);
}

module.exports = { getCommandDirectory, fileExists, readFile, writeFile };
