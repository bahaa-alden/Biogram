import mongoose from 'mongoose';
import { settings } from './settings';
import colors from 'colors';

const pass: any = settings.DB.PASSWORD;
const DB: any = settings.DB.DATABASE?.replace(
  '<PASSWORD>',
  settings.DB.PASSWORD
);

const ConnDB = () => {
  mongoose
    .connect(DB)
    .then(() => console.log(colors.cyan('DB connection succeeded').bold))
    .catch(() => console.log(colors.red('Mongo connection error')));
};

export default ConnDB;
