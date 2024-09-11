FROM node:20

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install ALL dependencies, including devDependencies
RUN npm install

# Copy the rest of the client code
COPY . .

# Run ESLint
RUN npm run lint

# Build the Next.js app
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]