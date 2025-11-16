FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .


RUN npm install --save-dev typescript @types/node tsconfig-paths
RUN npx tsc

EXPOSE 4000

CMD ["node", "dist/server.js"]
