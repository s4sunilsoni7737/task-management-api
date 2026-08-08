export const PORT = parseInt(process.env.PORT || '8000', 10);
export const API_PREFIX = process.env.API_PREFIX || 'api';
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const MONGO_DB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskflow';

export const JWT_SECRET_KEY = process.env.JWT_SECRET || 'dev-secret-change-me';
export const JWT_TOKEN_EXPIRE_TIME = process.env.JWT_EXPIRES_IN || '7d';

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'not-configured';
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'not-configured';
export const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8000/api/v1/auth/google/callback';
