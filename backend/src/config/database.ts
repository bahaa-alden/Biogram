import mongoose from 'mongoose';
import { settings } from './settings';

const getDatabaseUrl = (): string => {
  if (settings.NODE_ENV === 'production') {
    const dbUrl = settings.DB.DATABASE;
    if (!dbUrl) {
      throw new Error(
        'DATABASE environment variable is required for production. Please set DATABASE in your .env file.'
      );
    }
    return dbUrl.replace('<PASSWORD>', settings.DB.PASSWORD || '');
  }

  // Development mode - use local database or default
  const localDb =
    settings.DB.DATABASE_LOCAL || 'mongodb://localhost:27017/test';
  return localDb;
};

const ConnDB = (): void => {
  const DB = getDatabaseUrl();

  mongoose
    .connect(DB)
    .then(() => console.log('DB connection succeeded'))
    .catch((err) => {
      console.error('Mongo connection error:', err);
      process.exit(1);
    });
};

export default ConnDB;
