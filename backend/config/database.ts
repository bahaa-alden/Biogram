import mongoose from 'mongoose';
import { settings } from './settings';
import colors from 'colors';

const pass: any = settings.DB.PASSWORD;
const DB: any = settings.DB.DATABASE_LOCAL;

const ConnDB = () => {
  mongoose
    .connect(DB, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    })
    .then(() => console.log(colors.cyan('DB connection succeeded').bold))
    .catch(() => console.log(colors.red('Mongo connection error')));
};

export default ConnDB;
