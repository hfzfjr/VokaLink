# Production Dockerfile for VokaLink API (Coolify / Docker deployment)
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@12.14.0 --activate
WORKDIR /app

# Copy monorepo manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/core/package.json ./packages/core/

# Install dependencies with pnpm
RUN pnpm install --frozen-lockfile
RUN pnpm approve-builds --all

# Copy source files
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY packages/core/ ./packages/core/
COPY apps/api/ ./apps/api/

# Generate Prisma Client & compile TypeScript
RUN pnpm --filter api prisma generate
RUN pnpm --filter api build

# Expose port and run migrations + server
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["sh", "-c", "pnpm --filter api prisma:deploy && pnpm --filter api start"]
