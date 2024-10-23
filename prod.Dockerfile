FROM node:23-alpine3.19 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY ./prisma ./prisma/

RUN npx prisma generate

COPY . .

RUN npm build


FROM node:23-alpine3.19

WORKDIR /app

COPY --from=builder /app/dist/ ./dist/

RUN ["node", "dist/main.js"]