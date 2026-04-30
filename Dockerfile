FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY . .
USER appuser
EXPOSE 3000
CMD ["node", "server/index.js"]
