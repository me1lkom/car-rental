FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY migrations ./migrations

RUN npx tsc

EXPOSE 3000

CMD ["node", "dict/index.js"]