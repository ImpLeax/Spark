FROM node:20-slim

WORKDIR /spark_frontend

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build
