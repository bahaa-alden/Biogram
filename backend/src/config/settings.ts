import { config } from 'dotenv';
import path from 'path';
import { validateEnv } from './settings.schema';

// Load .env file from project root (two levels up from src/config)
config({ path: path.join(__dirname, '..', '..', '.env') });

// Validate environment variables
const env = validateEnv();

export const settings = {
  NODE_ENV: env.NODE_ENV,
  PORT: env.PORT,
  JWT_SECRET: env.JWT_SECRET_KEY,
  JWT_EXPIRES_IN: env.JWT_EXPIRES_IN,
  JWT_COOKIE_EXPIRES_IN: env.JWT_COOKIE_EXPIRES_IN,
  IMGUR_CLIENT_ID: env.IMGUR_CLIENT_ID,
  IMGUR_CLIENT_SECRET: env.IMGUR_CLIENT_SECRET,
  DB: {
    DATABASE: env.DATABASE,
    PASSWORD: env.PASSWORD,
    DATABASE_LOCAL: env.DATABASE_LOCAL || 'mongodb://localhost:27017/test',
  },
  MAILER: {
    HOST: env.EMAIL_HOST,
    PORT: env.EMAIL_PORT,
    USERNAME: env.EMAIL_USERNAME,
    PASSWORD: env.EMAIL_PASSWORD,
    FROM_ADDRESS: env.EMAIL_FROM,
    FROM_NAME: env.EMAIL_FROM_NAME,
  },
};
