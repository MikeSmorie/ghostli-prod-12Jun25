# syntax=docker/dockerfile:1

# Use official Node.js slim image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy full app code
COPY . .

# Build app
RUN npm run build

# Expose port for Fly.io
EXPOSE 8080

# Start app
CMD ["npm", "run", "start"]