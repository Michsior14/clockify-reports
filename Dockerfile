FROM docker.io/node:lts-alpine

ENV HOST=0.0.0.0
ENV PORT=3000

WORKDIR /app

RUN addgroup --system clockify-reports && \
    adduser --system -G clockify-reports clockify-reports

COPY dist/clockify-reports clockify-reports
RUN chown -R clockify-reports:clockify-reports .

# You can remove this install step if you build with `--bundle` option.
# The bundled output will include external dependencies.
RUN npm --prefix clockify-reports --omit=dev -f install

CMD [ "node", "main.js" ]
