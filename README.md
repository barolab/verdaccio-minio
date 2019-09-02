# Verdaccio - Minio

![GitHub](https://img.shields.io/github/license/barolab/verdaccio-minio)
![GitHub issues](https://img.shields.io/github/issues/barolab/verdaccio-minio)
[![Known Vulnerabilities](https://snyk.io//test/github/barolab/verdaccio-minio/badge.svg?targetFile=package.json)](https://snyk.io//test/github/barolab/verdaccio-minio?targetFile=package.json)
[![Coverage Status](https://coveralls.io/repos/github/barolab/verdaccio-minio/badge.svg?branch=master)](https://coveralls.io/github/barolab/verdaccio-minio?branch=master)
[![Build Status](https://travis-ci.com/barolab/verdaccio-minio.svg?branch=master)](https://travis-ci.com/barolab/verdaccio-minio)
![npm](https://img.shields.io/npm/v/verdaccio-minio)

A verdaccio plugin for storing data in [Minio](https://min.io/).

## Usage

You can use this plugin by installing it globally:

```sh
# Install the package globally
$ yarn global add verdaccio-minio

# Print the directory for your global packages
$ yarn global dir
/usr/local/share/.config/yarn/global

# Create a symbolic link to your package directory in the verdaccio plugin folder
$ ln -s /usr/local/share/.config/yarn/global/node_modules/verdaccio-minio /verdaccio/plugins/verdaccio-minio-storage
```

Then you'll need to provide a configuration file for the minio storage :

```yaml
# This points to the plugin folder above
plugins: /verdaccio/plugins

# This is mandatory, otherwise verdaccio won't boot
storage: /verdaccio/storage/data

# Here's the plugin configuration option
store:
  minio-storage:
    # The HTTP port of your minio instance
    port: 9000

    # The endpoint on which verdaccio will access minio (without scheme)
    endPoint: minio.minio.svc.cluster.local

    # The minio access key
    accessKey: this-is-not-so-secret

    # The minio secret key
    secretKey: this-is-not-so-secret

    # Disable SSL if you're accessing minio directly through HTTP
    useSSL: false

    # The region used by your minio instance (optional, default to "us-east-1")
    region: eu-west-1

    # A bucket where verdaccio will store it's database & packages (optional, default to "verdaccio")
    bucket: 'npm'

    # Number of retry when a request to minio fails (optional, default to 10)
    retries: 3

    # Delay between retries (optional, default to 100)
    delay: 50
# The rest of the verdaccio configuration
```

Once this is done you can start your Verdaccio instance, and check minio to see that the bucket as been created automatically

## Docker

A [docker image](https://cloud.docker.com/repository/docker/barolab/verdaccio/general) is also available for easy deployments. With docker compose :

```yaml
version: '3.7'

services:
  verdaccio:
    image: barolab/verdaccio
    ports:
      - 4873:4873
    volumes:
      - ./config.yaml:/verdaccio/conf/config.yaml
      - ./htpasswd:/verdaccio/storage/htpasswd
    depends_on:
      - minio
    environment:
      VERDACCIO_PROTOCOL: http
      VERDACCIO_PORT: 4873

  minio:
    image: minio/minio:RELEASE.2019-08-21T19-40-07Z
    command: server /data
    volumes:
      - minio:/data
    ports:
      - 9000:9000
    environment:
      MINIO_ACCESS_KEY: this-is-not-so-secret
      MINIO_SECRET_KEY: this-is-not-so-secret

volumes: minio:
```

> You'll need to write your config file and your htpasswd for the above to work.

If you'd like to check K8S resources I highly recommend you look at the [Minio](https://github.com/helm/charts/tree/master/stable/minio) and [Verdaccio](https://github.com/helm/charts/tree/master/stable/verdaccio) Helm charts.

## Contributing

It's highly recommended that you install the git hooks in your workstation before committing anything to this repository. You can run `yarn hooks` to install them.
There's some documentation for contributors that you should read first :

- [Code of Conduct](/doc/CODE_OF_CONDUCT.md)
- [Contribution Guide](/doc/CONTRIBUTING.md)

You'll need docker & yarn for a better development experience with this module. You can run `yarn start` to start a minio & verdaccio containers on ports [9000](http://localhost:9000) and [4873](http://localhost:4873). Then using the [`/example`](/example) folder you can install dependencies using verdaccio as a proxy.
