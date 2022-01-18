FROM node:16-alpine as compiler
WORKDIR /app
COPY package*.json tsconfig.json ./
COPY /src ./src
COPY /jest ./jest
RUN npm ci
RUN npm run build

FROM node:16-alpine as remover
WORKDIR /app
COPY --from=compiler /app/package*.json ./
COPY --from=compiler /app/dist ./dist
RUN npm ci --production

FROM gcr.io/distroless/nodejs:16
WORKDIR /app
COPY --from=remover /app ./
USER 1000
CMD [ "./dist" ]
