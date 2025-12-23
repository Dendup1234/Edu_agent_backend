# Use a specific version of Node.js as the base image for consistency
FROM node:20-alpine AS development

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies first (optimizes Docker cache layers)
# A wildcard is used to ensure both package.json and package-lock.json are copied
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Command to run the application with nodemon
CMD ["npm", "run", "dev"]
