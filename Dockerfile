# Use stable Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy rest of the app
COPY . .

# Expose port required by Fly (8080)
EXPOSE 8080

# Start the app (adjust to match your "start" command and port)
CMD ["npm", "run", "start"]