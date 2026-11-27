FROM node:lts-alpine

WORKDIR /app

# Install build tools temporarily so native modules (bcrypt) compile reliably on Alpine
RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install --omit=dev && apk del python3 make g++

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
