# ---------- runtime ----------
FROM node:22-alpine AS runner

# Create dedicated non-root user (UID 1007) with a home dir
RUN addgroup -S app && adduser -S -G app -u 1007 -h /home/app app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOME=/home/app

WORKDIR /app
EXPOSE 3000

# Copy runtime artifacts
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/.next ./.next
COPY --from=builder --chown=app:app /app/public ./public          # <-- ADD THIS
COPY --from=builder --chown=app:app /app/package*.json ./
COPY --from=builder --chown=app:app /app/prisma ./prisma

# Entrypoint
COPY --chown=app:app docker/entrypoint.sh /entrypoint.sh
RUN sed -i "s/\r$//" /entrypoint.sh && chmod +x /entrypoint.sh

USER app
ENTRYPOINT ["sh", "/entrypoint.sh"]
CMD ["npm", "start"]
