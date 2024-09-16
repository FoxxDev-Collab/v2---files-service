import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import logger from '../../utils/logger';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();

// Middleware to log requests
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_APP_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Global error handler:', { error: err.message, stack: err.stack });
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Authentication service proxy
const authProxy = createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/auth', // rewrite path
  },
});

app.use('/api/auth', (req, res, next) => {
  logger.info(`Proxying request to Auth Service: ${req.method} ${req.url}`);
  authProxy(req, res, next);
});

// Custom error handler for proxy errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Proxy error:', err);
  res.status(500).json({
    error: 'Proxy Error',
    message: err.message,
    code: err.code
  });
});

const PORT = process.env.GATEWAY_PORT || 4000;
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info('Environment variables:');
  logger.info(`CLIENT_APP_URL: ${process.env.CLIENT_APP_URL}`);
  logger.info(`AUTH_SERVICE_URL: ${process.env.AUTH_SERVICE_URL}`);
  logger.info(`GATEWAY_PORT: ${process.env.GATEWAY_PORT}`);
});

export default app;