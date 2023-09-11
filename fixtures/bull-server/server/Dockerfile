FROM ghcr.io/arvatoaws-labs/node:alpine

RUN mkdir /app
RUN mkdir /packages
WORKDIR /app

COPY ./ /app
RUN npm install

RUN chown -R nobody:nobody /app
RUN mkdir -p /.npm && chown -R nobody:nobody /.npm
USER nobody

# CMD ["npm", "start"]
