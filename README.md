bumper
======

Bumper helps you work with libraries.

## Usage

To install bumper, run:
```shell
npm install --global bumper
```

### Bump

Usage:
```shell
bumper bump <increment>

The bump command will bump the version in your package.json, package-lock.json and add a CHANGELOG.md entry if those files exist in your current directory.

Positionals:
  increment  Whether to bump the major, minor or patch version

Options for projects with a CHANGELOG.md file:
  --title, -t        Title of release
  --description, -d  Description of release, can be piped from stdin instead

Options:
  -h, --help     Show help
  -v, --version  Show version number
```

## Future

Bumper will house a mechanism to bump the version of your library inside other repos.
