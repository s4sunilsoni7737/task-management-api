import * as dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 8000;
export const API_PREFIX = 'api';
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
export const ALLOWED_ORIGINS = ['https://task-management-webportal.vercel.app', 'http://localhost:3000', 'http://localhost:3001'];

export const MONGO_DB_URI = process.env.MONGO_DB_URI || '';

export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'dev-secret-change-me';
export const JWT_TOKEN_EXPIRE_TIME = process.env.JWT_TOKEN_EXPIRE_TIME || '7d';

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
export const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8000/api/v1/auth/google/callback';
