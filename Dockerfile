FROM node:16-alpine

RUN npm install pm2 -g

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --production

COPY ./dist ./dist

CMD [ "pm2-docker", "./dist" ]
