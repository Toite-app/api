# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install python and build dependencies
RUN apk add --no-cache python3 make g++

COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

COPY . .

# Build the application
RUN yarn build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install python and build dependencies for production packages that need compilation
RUN apk add --no-cache python3 make g++

COPY package.json yarn.lock ./

# Install only production dependencies
RUN yarn install --frozen-lockfile --production

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/i18n ./src/i18n
COPY --from=builder /app/src/i18n/messages ./dist/i18n/messages

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
