FROM node:16

WORKDIR /media

MAINTAINER faab007nl

RUN apt-get update
RUN apt-get install -y git python-virtualenv

COPY ./index.js ./
COPY ./package.json ./
COPY ./package-lock.json ./

RUN npm install

EXPOSE 1609

CMD [ "npm", "start" ]