FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# 🔥 Copy prisma schema PRIJE npm install
COPY prisma ./prisma/

# Install dependencies (sada može pronaći schema.prisma)
RUN npm install

# Copy rest of source code
COPY . .

# Build the application
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
