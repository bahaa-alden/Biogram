# Backend Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock* package-lock.json* ./

# Install dependencies
RUN yarn install --frozen-lockfile || npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN yarn build || npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock* package-lock.json* ./

# Install only production dependencies
RUN yarn install --production --frozen-lockfile || npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/build ./build

# Copy source files for Swagger documentation (swagger-jsdoc needs source files with JSDoc comments)
COPY --from=builder /app/src ./src

# Copy public directory if it exists
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "build/server.js"]

