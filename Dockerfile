# ============================================
# Angular Frontend Build + Nginx (Coolify)
# ============================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Git telepitese a verzio hash-hoz
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --ignore-scripts

# Copy source code
COPY . .

# Git hash atadasa build arg-kent (Coolify: SOURCE_COMMIT)
ARG GIT_HASH=""
ENV GIT_HASH=${GIT_HASH}

# Build for production (increase heap for large Angular builds)
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# Stage 2: Production Nginx
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist/frontend-tablo /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
