# Multi-stage lightweight Node.js runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production || npm install --production

# Copy source code and assets
COPY server.js ./
COPY public ./public

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Non-root user for container security
USER node

CMD ["node", "server.js"]
