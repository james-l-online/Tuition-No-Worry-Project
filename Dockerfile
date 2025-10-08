# dependencies
FROM node:22-alpine AS deps
WORKDIR /app
# Some DB client libraries require OpenSSL on Alpine
RUN apk add --no-cache openssl
# Install dependencies (including dev) for build caching
COPY package*.json ./
RUN npm ci

# builder
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY public ./public
COPY sql ./sql
COPY scripts ./scripts
COPY next.config.mjs tsconfig.json postcss.config.mjs tailwind.config.ts package*.json ./
COPY .env.example README.md .pre-commit-config.yaml docker ./
# Generate artifacts needed for the build. If you depend on local-only build-time tools, run them locally before building the image.
# Build Next.js app
RUN npm run build
# After building, prune dev dependencies to shrink node_modules to production-only.
# This lets us copy production node_modules into the final image without reinstalling.
RUN npm prune --production

# runtime 
FROM node:22-alpine AS runner
# Install OpenSSL in the runtime image (some DB client libraries require it on Alpine)
RUN apk add --no-cache openssl
ENV NODE_ENV=production PORT=3000 HOME=/home/node
WORKDIR /app
EXPOSE 3000

# Copy production node_modules (pruned in builder) and essential build output
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/sql ./sql
COPY --from=builder --chown=node:node /app/scripts ./scripts
COPY --from=builder --chown=node:node /app/package*.json ./

# Entrypoint
COPY --chown=node:node docker/entrypoint.sh /entrypoint.sh
# Fix potential Windows line endings issue and ensure script is executable
RUN sed -i "s/\r$//" /entrypoint.sh && chmod +x /entrypoint.sh

# Image metadata (semantic labels)
LABEL org.opencontainers.image.title="Tuition No Worry"
LABEL org.opencontainers.image.description="Tuition No Worry Next.js application"
LABEL org.opencontainers.image.authors="Tuition No Worry Team"
LABEL org.opencontainers.image.licenses="MIT"

# Lightweight HTTP healthcheck using Node (no additional binaries required).
# It probes the app root on PORT (defaults to 3000) and succeeds for 2xx/3xx responses.
# Runs as the image's runtime user; keep the command as a JSON array to avoid shell parsing issues.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD ["node","-e","const http=require('http');const port=(process.env.PORT||3000);const req=http.get({host:'127.0.0.1',port:port,path:'/'},res=>{if(res.statusCode>=200&&res.statusCode<400)process.exit(0);else process.exit(1)});req.on('error',()=>process.exit(1));"]

# non-root user for security (use existing node user)
USER node
ENTRYPOINT ["sh", "/entrypoint.sh"]
CMD ["npm", "start"]
