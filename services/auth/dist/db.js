"use strict";
// services/auth/src/db.ts
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    user: process.env.DB_USER || 'newcloud_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'newcloud',
    password: process.env.DB_PASSWORD || 'NOTthisday@@22',
    port: parseInt(process.env.DB_PORT || '5432'),
});
exports.default = pool;
