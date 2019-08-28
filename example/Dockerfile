FROM verdaccio/verdaccio:4.2.2

# Install minio plugin
USER root
ENV NODE_ENV=production
COPY verdaccio-minio-storage /usr/local/lib/node_modules/verdaccio-minio-storage
RUN cd /usr/local/lib/node_modules/verdaccio-minio-storage && \
  npm install --production && \
  ln -s /usr/local/lib/node_modules/verdaccio-minio-storage /verdaccio/plugins/verdaccio-minio-storage  && \
  chown -R 10001 /usr/local/lib/node_modules/verdaccio-minio-storage && \
  chown -R 10001 /verdaccio/plugins

# Copy config with minio storage defined
COPY config.yaml /verdaccio/conf

# Copy user credentials (admin/admin)
COPY htpasswd /verdaccio/storage/htpasswd

# Reset user to the default one
USER verdaccio
