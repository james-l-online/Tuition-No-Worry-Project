# ---------- deps ----------
FROM node:22-alpine AS deps
WORKDIR /app
# Prisma needs OpenSSL at runtime on Alpine
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci

# ---------- builder ----------
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client for the build
RUN npx prisma generate
# Build Next.js app
RUN npm run build

# ---------- runtime ----------
FROM node:22-alpine AS runner
# Install OpenSSL in the runtime image (Prisma needs it at runtime on Alpine)
RUN apk add --no-cache openssl
ENV NODE_ENV=production PORT=3000 HOME=/home/node
WORKDIR /app
EXPOSE 3000
EXPOSE 5555

# Copy only essential files for runtime
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/prisma ./prisma

# Entrypoint
COPY --chown=node:node docker/entrypoint.sh /entrypoint.sh
RUN sed -i "s/\r$//" /entrypoint.sh && chmod +x /entrypoint.sh

# non-root user for security
USER node
ENTRYPOINT ["sh", "/entrypoint.sh"]
CMD ["npm", "start"]
