FROM node:20-alpine

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependency manifests first (layer cache — only reinstalls when these change)
COPY package.json pnpm-lock.yaml* .npmrc* ./

# Install dependencies using BuildKit cache for pnpm store (faster rebuilds)
RUN --mount=type=cache,id=pnpm-frontend,target=/root/.local/share/pnpm/store \
    pnpm install

EXPOSE 3000

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Required for hot-reload file watching inside Docker
ENV WATCHPACK_POLLING=true

CMD ["pnpm", "dev"]
