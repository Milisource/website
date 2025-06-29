# === Base build image ===
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps and cache them
COPY package*.json ./
RUN npm install

# Copy rest of the app
COPY . .

# Build the app
RUN npm run build

# === Final runtime image ===
FROM node:20-alpine AS runner

WORKDIR /app

# Install system dependencies for better DNS resolution and networking
RUN apk add --no-cache ca-certificates curl

# Install only production deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy the built app from the builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/package.json ./

EXPOSE 3000

# Set environment variables for better Alpine Linux compatibility
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Use Next.js production server
CMD ["npm", "start"]

