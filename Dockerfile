FROM node:23

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your server code
COPY . .

# Expose port 3000 (or whatever your server uses)
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
