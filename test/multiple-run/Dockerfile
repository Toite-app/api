FROM node:20-slim AS base

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Install nest CLI globally
RUN yarn global add @nestjs/cli

FROM base AS runner
WORKDIR /app

# COPY ../../src ./src
COPY ../../package.json ./package.json
COPY ../../yarn.lock ./yarn.lock
COPY ../../tsconfig.json ./tsconfig.json
COPY ../../tsconfig.build.json ./tsconfig.build.json
COPY ../../nest-cli.json ./nest-cli.json

# We'll mount the app files instead of copying them
# This allows for live development
# The dist folder will be created separately for each instance

# Use a shell to handle the dist directory cleanup
CMD ["yarn", "start:dev"]
