FROM node:18-alpine

WORKDIR /app

# Copiar solo package.json
COPY package*.json ./

# Install dependencies
RUN npm ci --production

# Copiar el código
COPY server/ ./server/
COPY client/build/ ./client/build/

# Exponer puerto
EXPOSE 5000

# Start
CMD ["node", "server/index.js"]
