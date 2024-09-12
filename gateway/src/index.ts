import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Proxy middleware configuration
app.use('/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/auth': '', // remove /auth from the URL
  },
}));

// Add more proxy routes for other services as they are developed

// For now, proxy all other requests to the client app
app.use('/', createProxyMiddleware({
  target: process.env.CLIENT_APP_URL || 'http://localhost:3000',
  changeOrigin: true,
}));

const PORT = process.env.GATEWAY_PORT || 4000;
app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});