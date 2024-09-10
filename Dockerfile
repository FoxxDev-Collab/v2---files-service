FROM node:20

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY client/app/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the client code
COPY client/app .

# Build the Next.js app
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD [ "npm", "start" ]