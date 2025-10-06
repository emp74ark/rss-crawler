FROM node:22-slim
RUN corepack enable
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build

FROM node:22-slim
RUN corepack enable
WORKDIR /app
COPY package*.json .
RUN pnpm install --prod
COPY --from:builder /app/dist ./dist/
COPY --from:builder /app/.env ./
ENV NODE_ENV=production
RUN sh ./puppeteer.sh
CMD ["node", "dist/main.js"]
