# syntax=docker/dockerfile:1
FROM node:24.4.0-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN corepack prepare pnpm@10.22.0 --activate

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y python3 make g++ git python3-pip pkg-config libsecret-1-dev && rm -rf /var/lib/apt/lists/*

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install

# Build workspace projects
ENV NODE_ENV=production
RUN pnpm --filter=@dpploy/server build
RUN pnpm --filter=dpploy run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y curl unzip zip apache2-utils iproute2 rsync git-lfs && git lfs install && rm -rf /var/lib/apt/lists/*

# Copy workspace metadata
COPY --from=build /usr/src/app/package.json ./package.json
COPY --from=build /usr/src/app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /usr/src/app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Copy built server
COPY --from=build /usr/src/app/packages/server/dist ./packages/server/dist
COPY --from=build /usr/src/app/packages/server/package.json ./packages/server/package.json

# Copy dpploy app
COPY --from=build /usr/src/app/apps/dpploy/.next ./apps/dpploy/.next
COPY --from=build /usr/src/app/apps/dpploy/dist ./apps/dpploy/dist
COPY --from=build /usr/src/app/apps/dpploy/public ./apps/dpploy/public
COPY --from=build /usr/src/app/apps/dpploy/package.json ./apps/dpploy/package.json
COPY --from=build /usr/src/app/apps/dpploy/next.config.mjs ./apps/dpploy/next.config.mjs
COPY --from=build /usr/src/app/apps/dpploy/drizzle ./apps/dpploy/drizzle
COPY --from=build /usr/src/app/apps/dpploy/components.json ./apps/dpploy/components.json

# Install production dependencies only
RUN pnpm install --prod --no-frozen-lockfile

# Install external tools needed by Dokploy
RUN curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh --version 28.5.2 && rm get-docker.sh && curl https://rclone.org/install.sh | bash

ARG NIXPACKS_VERSION=1.41.0
RUN curl -sSL https://nixpacks.com/install.sh -o install.sh && chmod +x install.sh && ./install.sh && pnpm install -g tsx

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --retries=10 \
  CMD curl -fs http://localhost:3000/api/trpc/settings.health || exit 1

WORKDIR /app/apps/dpploy
COPY .env.production ./.env

CMD ["sh", "-c", "pnpm run wait-for-postgres && exec pnpm start"]
