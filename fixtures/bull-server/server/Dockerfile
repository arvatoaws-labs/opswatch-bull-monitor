FROM ghcr.io/arvatoaws-labs/node:alpine

RUN mkdir /app
RUN mkdir /packages
RUN mkdir /packages/root
RUN mkdir /packages/express
WORKDIR /app

# ADD ./opswatch-bull-monitor/fixtures/bull-server/server /app
# RUN npm install

# ADD ./opswatch-bull-monitor/packages/root/ /packages/root
# RUN npm install

# ADD ./opswatch-bull-monitor/packages/express/ /packages/express/
# RUN npm install

ADD ./fixtures/bull-server/server /app
RUN npm install

ADD ./packages/root/ /packages/root
RUN npm install

ADD ./packages/express/ /packages/express/
RUN npm install

CMD ["npm", "start"]