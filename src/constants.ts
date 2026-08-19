/**
 * Security Note: For local development we currently use `.env` files. 
 * However, .env files are notoriously susceptible to accidental leaks and are frequent 
 * targets for automated vulnerability scanners. For live production deployments, we will 
 * rely on static constants where CI/CD YAML scripts securely provide the path of this 
 * constants file and inject credentials directly at build time, completely avoiding 
 * environment variables in the runtime space.
 * 
 * Note: Hardcoded fallback credentials have been completely removed from this file 
 * to ensure production readiness.
 * 
 * Live URLs:
 * Frontend: https://ablespace-ten.vercel.app/tasks
 * Backend Docs: https://task-management-api-gold.vercel.app/api/docs
 */
import * as dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 8000;
export const API_PREFIX = 'api';
export const FRONTEND_URL = process.env.FRONTEND_URL || '';
export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? [
      ...new Set([
        ...process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
      ]),
    ]
  : [];

export const MONGO_DB_URI = process.env.MONGO_DB_URI || '';

export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || '';
export const JWT_TOKEN_EXPIRE_TIME = process.env.JWT_TOKEN_EXPIRE_TIME || '7d';

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
export const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || '';

export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';
