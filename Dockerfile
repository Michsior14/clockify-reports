FROM docker.io/node:lts-alpine

ENV HOST=0.0.0.0
ENV PORT=3000

WORKDIR /app

RUN addgroup --system clockify-reports && \
    adduser --system -G clockify-reports clockify-reports

COPY .yarn .yarn
COPY .yarnrc.yml .yarnrc.yml
COPY dist/clockify-reports .
RUN chown -R clockify-reports:clockify-reports .

RUN yarn install

CMD [ "node", "main.js" ]
