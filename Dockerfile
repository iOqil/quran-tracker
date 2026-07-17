# Stage 1: Build the React client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build the Node Express server
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npx prisma generate
RUN npm run build

# Stage 3: Runtime
FROM node:20-alpine AS runner
WORKDIR /app

# Copy server package and build files from builder
COPY --from=server-builder /app/server/package*.json ./server/
COPY --from=server-builder /app/server/node_modules ./server/node_modules
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/prisma ./server/prisma

# Copy built client assets
COPY --from=client-builder /app/client/dist ./client/dist

# Expose production port
EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

# Start command: runs Prisma migration deploy automatically, then starts the Express server
CMD ["sh", "-c", "cd server && npx prisma migrate deploy && node dist/index.js"]
