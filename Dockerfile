# Production image for the admin_modern Next.js app. Served ONLY through
# the nginx container (see conf.d/edubex.conf) — no host port is published.
# Build with: docker compose build admin_modern
FROM node:18-alpine

WORKDIR /app

# pnpm matches pnpm-lock.yaml (lockfileVersion 9 = pnpm 9.x). corepack ships
# with the node image, so no global npm install (and no root-owned
# /usr/local/lib/node_modules permission fight) is needed.
RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
EXPOSE 3000

CMD ["pnpm", "start"]
