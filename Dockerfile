# dependencies
FROM node:22-alpine AS deps
WORKDIR /app
# Prisma needs OpenSSL at runtime on Alpine
RUN apk add --no-cache openssl
# Install dependencies (including dev) for build caching
COPY package*.json ./
RUN npm ci

# builder
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
# Allow passing a DATABASE_URL at build time (some pages may run Prisma during build)
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
# Copy only node_modules from deps (cached) and the minimal source files needed to build
# This avoids sending the entire repo and improves Docker cache efficiency.
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
COPY src ./src
COPY public ./public
# Copy other top-level config files needed during build
COPY next.config.mjs tsconfig.json postcss.config.mjs tailwind.config.ts package*.json ./
COPY next-env.d.ts .env.example README.md .pre-commit-config.yaml docker ./
# Generate Prisma client for the build
RUN npx prisma generate
# Build Next.js app
RUN npm run build
# After building, prune dev dependencies to shrink node_modules to production-only.
# This lets us copy production node_modules into the final image without reinstalling.
RUN npm prune --production

# runtime 
FROM node:22-alpine AS runner
# Install OpenSSL in the runtime image (Prisma needs it at runtime on Alpine)
RUN apk add --no-cache openssl
ENV NODE_ENV=production PORT=3000 HOME=/home/node
WORKDIR /app
EXPOSE 3000
# for prisma studio (if needed)
EXPOSE 5555

# Copy production node_modules (pruned in builder) and essential build output
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/package*.json ./

# Entrypoint
COPY --chown=node:node docker/entrypoint.sh /entrypoint.sh
# Fix potential Windows line endings issue and ensure script is executable
RUN sed -i "s/\r$//" /entrypoint.sh && chmod +x /entrypoint.sh

# non-root user for security (use existing node user)
USER node
ENTRYPOINT ["sh", "/entrypoint.sh"]
CMD ["npm", "start"]
