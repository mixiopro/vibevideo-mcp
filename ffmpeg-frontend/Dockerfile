FROM node:20-alpine

# Set workdir
WORKDIR /app

# Copy only package files first for better cache use
COPY package*.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install

# Copy all source code
COPY . .

# Expose API and Vite ports
EXPOSE 8080 8300

# Default: run both frontend (Vite) and backend (Express)
CMD ["pnpm", "run", "dev"]
