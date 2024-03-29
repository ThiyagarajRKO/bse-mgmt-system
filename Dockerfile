FROM node:18

WORKDIR /usr/src/app

COPY . .

RUN npm install

EXPOSE 4000

CMD ["npm", "start"]
