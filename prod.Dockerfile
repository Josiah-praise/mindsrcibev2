FROM node AS builder

WORKDIR /app

COPY ./package*.json .

RUN npm ci

COPY ./prisma ./prisma/

RUN npx prisma generate

COPY . .

RUN npm build

FROM node

WORKDIR /app

COPY --from=builder /app/dist/ ./dist/

RUN ["node", "main.js"]