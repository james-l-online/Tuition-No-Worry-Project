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
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
# Prisma Studio
# EXPOSE 5555

# minimal runtime files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# entrypoint
COPY docker/entrypoint.sh /entrypoint.sh
RUN sed -i "s/\r$//" /entrypoint.sh && chmod +x /entrypoint.sh



# (optional) force run via sh to bypass shebang issues
ENTRYPOINT ["sh", "/entrypoint.sh"]
CMD ["npm", "start"]
