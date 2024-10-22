FROM node:23-alpine3.19

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY /prisma ./prisma/

RUN npx prisma generate

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
