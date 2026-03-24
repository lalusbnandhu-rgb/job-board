FROM node:20-alpine

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependency manifests first (layer cache — only reinstalls when these change)
COPY package.json pnpm-lock.yaml* .npmrc* ./

# Install dependencies using BuildKit cache for pnpm store (faster rebuilds)
RUN --mount=type=cache,id=pnpm-backend,target=/root/.local/share/pnpm/store \
    pnpm install

EXPOSE 5000

CMD ["pnpm", "dev"]
