FROM node:22

WORKDIR /usr/src/app

# Copy package.json and package-lock.json from the parent directory
COPY services/auth/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the auth service code
COPY services/auth .

# Typescript is a devDependency, so we need to install it for the build
RUN npm install typescript

# Build the app
RUN npm run build

EXPOSE 3001

# Run the compiled JavaScript
CMD ["node", "dist/server.js"]

RUN mkdir -p /usr/src/app/uploads && chmod 775 /usr/src/app/uploads