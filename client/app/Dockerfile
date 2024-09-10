FROM node:20

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY client/app/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the client code
COPY client/app .

# Build the app if a build script exists, otherwise skip
RUN if npm run build; then \
      echo "Build successful"; \
    else \
      echo "No build script found, skipping build step"; \
    fi

EXPOSE 3000

# Use a more flexible start command
CMD ["npm", "start"]