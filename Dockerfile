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
# non-root user for security
RUN addgroup -S app && adduser -S -G app -u 1007 -h /home/app app
ENV NODE_ENV=production PORT=3000 HOME=/home/app
WORKDIR /app
EXPOSE 3000

# Copy only essential files for runtime
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/.next ./.next
COPY --from=builder --chown=app:app /app/public ./public
COPY --from=builder --chown=app:app /app/package*.json ./
COPY --from=builder --chown=app:app /app/prisma ./prisma

# Entrypoint
COPY --chown=app:app docker/entrypoint.sh /entrypoint.sh
RUN sed -i "s/\r$//" /entrypoint.sh && chmod +x /entrypoint.sh

USER app
ENTRYPOINT ["sh", "/entrypoint.sh"]
CMD ["npm", "start"]
