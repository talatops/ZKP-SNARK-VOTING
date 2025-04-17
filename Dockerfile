FROM node:16

WORKDIR /app

COPY package.json ./
# Only copy package-lock.json if it exists
COPY package*.json ./

RUN npm install

COPY . ./

EXPOSE 3000

CMD ["npm", "start"] 