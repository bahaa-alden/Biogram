import mongoose from 'mongoose';
import { settings } from './settings';

let DB: any = '';
const pass: any = settings.DB.PASSWORD;
if (settings.NODE_ENV === 'production') {
  DB = settings.DB.DATABASE?.replace('<PASSWORD>', settings.DB.PASSWORD);
} else {
  DB = settings.DB.DATABASE_LOCAL;
}


const ConnDB = () => {
  mongoose
    .connect(DB)
    .then(() => console.log('DB connection succeeded'))
    .catch(() => console.log('Mongo connection error'));
};

export default ConnDB;
