FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev


FROM node:22-alpine AS runtime

# Remove npm from the production image.
# The application only needs Node.js at runtime, and this also removes
# vulnerable npm-bundled packages detected by Trivy.
RUN rm -rf /usr/local/lib/node_modules/npm \
    && rm -f /usr/local/bin/npm \
    && rm -f /usr/local/bin/npx

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src

RUN chown -R node:node /app

USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:5000/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]