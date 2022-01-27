FROM node:16-alpine as compiler
WORKDIR /app
COPY package*.json tsconfig.json .env.production ./
COPY /src ./src
COPY /bot ./bot
COPY /public ./public
RUN npm ci
RUN npm run build

FROM node:16-alpine as remover
WORKDIR /app
COPY --from=compiler /app/package*.json ./
COPY --from=compiler /app/dist ./dist
COPY --from=compiler /app/build ./build
RUN npm ci --production

FROM gcr.io/distroless/nodejs:16
WORKDIR /app
COPY --from=remover /app ./
USER 1000
CMD [ "." ]
