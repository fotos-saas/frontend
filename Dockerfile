# ============================================
# Angular Frontend Build + Nginx (Coolify)
# ============================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --ignore-scripts

# Copy source code
COPY . .

# Build for production
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
