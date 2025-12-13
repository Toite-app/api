FROM node:22-slim AS builder

WORKDIR /app

# Install build dependencies for native modules (argon2)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy TypeScript config and source files
COPY tsconfig.json ./
COPY utils/seed ./utils/seed
COPY src/@base/drizzle ./src/@base/drizzle

# Bundle the seed script with esbuild
RUN npx esbuild utils/seed/seed.ts \
    --bundle \
    --platform=node \
    --outfile=seed.js \
    --external:pg \
    --external:argon2

# Dependencies stage
FROM node:22-slim AS deps

WORKDIR /app

# Install build dependencies for argon2 native compilation
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install only runtime dependencies
RUN yarn add pg@8.11.3 argon2@0.41.1

# Runner stage (non-root)
FROM node:22-slim AS runner

WORKDIR /app

# Create non-root user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs seeduser

# Copy dependencies and bundled script
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/seed.js ./
COPY src/@base/drizzle/migrations ./src/@base/drizzle/migrations

# Set ownership to non-root user
RUN chown -R seeduser:nodejs /app

ENV NODE_ENV=production

# Switch to non-root user
USER seeduser

CMD ["node", "seed.js"]

