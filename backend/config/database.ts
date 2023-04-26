import mongoose from 'mongoose';
import { settings } from './settings';

const DB: any = settings.DB.DATABASE_LOCAL;

const ConnDB = () => {
  mongoose
    .connect(DB)
    .then(() => console.log('DB connection succeeded'))
    .catch(() => console.log('Mongo connection error'));
};

export default ConnDB;
