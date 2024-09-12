# New Cloud

New Cloud is a modern web application built with Node.js, Next.js, and a microservices architecture. It aims to provide a robust cloud storage and collaboration platform.

## Project Structure

```
new-cloud/
├── services/
│   ├── auth/
│   ├── files/ (planned)
│   ├── talk/ (planned)
│   ├── groupware/ (planned)
│   └── office/ (planned)
├── client/
│   └── app/
├── shared/ (planned)
│   ├── utils/
│   └── models/
├── gateway/ (planned)
├── config/
├── docker-compose.yml
└── README.md
```

## Current State

The project is in active development. Currently, the following components are implemented:

- Authentication service
- Client application (Next.js)

## Technologies Used

### Backend
- Node.js (v20.x LTS)
- Express.js
- PostgreSQL
- JSON Web Tokens (JWT) for authentication
- bcrypt for password hashing
- multer for file uploads

### Frontend
- Next.js 14
- React 18
- TailwindCSS for styling
- Axios for API requests

### DevOps
- Docker and Docker Compose for containerization
- npm for package management

## Key Packages

### Backend (Auth Service)
- express: ^5.0.0
- jsonwebtoken: ^9.0.2
- bcrypt: ^5.1.1
- pg: ^8.12.0 (PostgreSQL client)
- multer: ^1.4.5-lts.1
- cors: ^2.8.5

### Frontend (Next.js App)
- next: ^14.2.8
- react: ^18.2.0
- react-dom: ^18.2.0
- @tanstack/react-query: ^5.55.4
- axios: ^1.7.7
- tailwindcss: ^3.3.2

## Setup Instructions

1. Clone the repository:
   ```
   git clone https://github.com/your-username/new-cloud.git
   cd new-cloud
   ```

2. Install dependencies:
   ```
   npm install
   cd client/app && npm install
   cd ../../services/auth && npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory and in `services/auth/`
   - Add necessary environment variables (database connection, JWT secret, etc.)

4. Start the development servers:
   ```
   # In the root directory
   docker-compose up -d   # Start PostgreSQL

   # In services/auth
   npm run dev

   # In client/app
   npm run dev
   ```

5. Access the application:
   - Frontend: http://localhost:3000
   - Auth API: http://localhost:3001

## API Documentation

(Include a brief overview of available API endpoints, or link to a more detailed API documentation)

## Contributing

(Add guidelines for contributing to the project)

## License

(Specify the license under which the project is released)

## Roadmap

(To be added by you)

---

This README is a living document and will be updated as the project evolves.