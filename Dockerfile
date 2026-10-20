FROM node:24-bookworm-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npx prisma generate --schema=prisma/schema.postgres.prisma
RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "run", "start"]
