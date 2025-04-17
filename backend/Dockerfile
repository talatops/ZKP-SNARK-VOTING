FROM node:16

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p logs

EXPOSE 5000

CMD ["npm", "start"] 