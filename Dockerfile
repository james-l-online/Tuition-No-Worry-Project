# ---------- deps ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---------- builder ----------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# generate client at build-time (no DB needed)
RUN npx prisma generate
# build your Next.js/app
RUN npm run build

# ---------- runtime ----------
FROM node:22-alpine AS runner

# Create dedicated non-root user (UID 1007) with a home dir
# (avoid UID 1000 collisions)
RUN addgroup -S app && adduser -S -G app -u 1007 -h /home/app app

ENV NODE_ENV=development
ENV PORT=3000
ENV HOME=/home/app

WORKDIR /app
EXPOSE 3000
# Prisma Studio
# EXPOSE 5555

# Copy only essentials for runtime and assign ownership at copy-time
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/.next ./.next
COPY --from=builder --chown=app:app /app/package*.json ./
COPY --from=builder --chown=app:app /app/prisma ./prisma

# entrypoint to set ownership at copy-time; chmod requires root, so do it now)
COPY --chown=app:app docker/entrypoint.sh /entrypoint.sh
RUN sed -i "s/\r$//" /entrypoint.sh && chmod +x /entrypoint.sh

# Drop privileges for runtime
USER app

# (optional) force run via sh to bypass shebang issues
ENTRYPOINT ["sh", "/entrypoint.sh"]
CMD ["npm", "start"]
