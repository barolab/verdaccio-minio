FROM verdaccio/verdaccio:4.3.4

# Install minio plugin
USER root
ENV NODE_ENV=production
COPY verdaccio-minio /usr/local/lib/node_modules/verdaccio-minio
RUN cd /usr/local/lib/node_modules/verdaccio-minio && \
  yarn install --production --ignore-scripts && \
  ln -s /usr/local/lib/node_modules/verdaccio-minio /verdaccio/plugins/verdaccio-minio  && \
  chown -R 10001 /usr/local/lib/node_modules/verdaccio-minio && \
  chown -R 10001 /verdaccio/plugins

# Copy config with minio storage defined
COPY config.yaml /verdaccio/conf

# Copy user credentials (admin/admin)
COPY htpasswd /verdaccio/storage/htpasswd

# Reset user to the default one
USER verdaccio
