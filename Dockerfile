# build
FROM node:lts-alpine as build

WORKDIR /app
COPY ./ .
RUN npm ci --silent

RUN npm run build

# app
FROM nginx:stable-alpine

RUN mkdir /www
COPY --from=build /app/build/inlined /data/stock
COPY ./nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
