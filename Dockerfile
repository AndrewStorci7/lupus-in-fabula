# STAGE 1: build
FROM node:20 AS builder

WORKDIR /app

COPY package*.json tsconfig.server.json ./
RUN npm install

COPY src/server ./src/server

# Compila solo server.ts senza errori Next.js
RUN npx tsc -p tsconfig.server.json

# STAGE 2: run
FROM node:20-slim
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/server/server.js"]
