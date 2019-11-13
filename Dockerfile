FROM verdaccio/verdaccio:4.3.4
USER root
ENV NODE_ENV=production
RUN yarn global add verdaccio-minio && \
  ln -s /usr/local/share/.config/yarn/global/node_modules/verdaccio-minio /verdaccio/plugins/verdaccio-minio  && \
  chown -R 10001 /usr/local/share/.config/yarn/global/node_modules/verdaccio-minio && \
  chown -R 10001 /verdaccio/plugins

USER verdaccio
