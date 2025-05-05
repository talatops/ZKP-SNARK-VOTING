FROM node:16

WORKDIR /app

COPY package*.json ./
# Copy .npmrc for npm configuration
COPY .npmrc ./

# Increase npm timeout and retry options to deal with network issues
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    NODE_OPTIONS=--max_old_space_size=4096 npm ci || npm install

COPY . .

RUN mkdir -p logs

EXPOSE 5000

CMD ["npm", "start"] 