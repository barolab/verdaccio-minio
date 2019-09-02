# Verdaccio - Minio

![GitHub](https://img.shields.io/github/license/barolab/verdaccio-minio)
![GitHub issues](https://img.shields.io/github/issues/barolab/verdaccio-minio)
[![Coverage Status](https://coveralls.io/repos/github/barolab/verdaccio-minio/badge.svg?branch=master)](https://coveralls.io/github/barolab/verdaccio-minio?branch=master)
[![Build Status](https://travis-ci.com/barolab/verdaccio-minio.svg?branch=master)](https://travis-ci.com/barolab/verdaccio-minio)
![npm](https://img.shields.io/npm/v/verdaccio-minio)

A verdaccio plugin for storing data in [Minio](https://min.io/).

## Contributing

It's highly recommended that you install the git hooks in your workstation before committing anything to this repository. You can run `yarn hooks` to install them.
There's some documentation for contributors that you should read first :

- [Code of Conduct](/doc/CODE_OF_CONDUCT.md)
- [Contribution Guide](/doc/CONTRIBUTING.md)

You'll need docker & yarn for a better development experience with this module. You can run `yarn start` to start a minio & verdaccio containers on ports [9000](http://localhost:9000) and [4873](http://localhost:4873). Then using the [`/example`](/example) folder you can install dependencies using verdaccio as a proxy.
