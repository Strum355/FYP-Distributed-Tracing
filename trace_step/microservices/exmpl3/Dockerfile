FROM node:13

WORKDIR /service

COPY microservices/exmpl3/package.json package.json
COPY microservices/exmpl3/package-lock.json package-lock.json

COPY microservices/exmpl3/ .

COPY nodejs /nodejs

RUN cd /nodejs && npm run compile
RUN npm i /nodejs && npm i

ENTRYPOINT [ "npm", "run", "start" ]