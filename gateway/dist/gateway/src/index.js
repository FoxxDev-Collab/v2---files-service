"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("../../utils/logger"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const app = (0, express_1.default)();
// Middleware to log requests
app.use((req, res, next) => {
    logger_1.default.info(`Incoming request: ${req.method} ${req.url}`);
    next();
});
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Error handling middleware
app.use((err, req, res, next) => {
    logger_1.default.error('Global error handler:', { error: err.message, stack: err.stack });
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});
// Authentication service proxy
const authProxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: {
        '^/api/auth': '/auth', // rewrite path
    },
});
app.use('/api/auth', (req, res, next) => {
    logger_1.default.info(`Proxying request to Auth Service: ${req.method} ${req.url}`);
    authProxy(req, res, next);
});
// Custom error handler for proxy errors
app.use((err, req, res, next) => {
    console.error('Proxy error:', err);
    res.status(500).json({
        error: 'Proxy Error',
        message: err.message,
        code: err.code
    });
});
const PORT = process.env.GATEWAY_PORT || 4000;
app.listen(PORT, () => {
    logger_1.default.info(`API Gateway running on port ${PORT}`);
    logger_1.default.info('Environment variables:');
    logger_1.default.info(`CLIENT_APP_URL: ${process.env.CLIENT_APP_URL}`);
    logger_1.default.info(`AUTH_SERVICE_URL: ${process.env.AUTH_SERVICE_URL}`);
    logger_1.default.info(`GATEWAY_PORT: ${process.env.GATEWAY_PORT}`);
});
exports.default = app;
