FROM node:16

WORKDIR /media

MAINTAINER faab007nl

RUN apt-get update
RUN apt-get install -y git python-virtualenv

RUN git clone https://github.com/InsaneEditor/InsaneEditorBackend.git /media

RUN npm install

EXPOSE 1609

CMD [ "npm", "start" ]