import multer from 'multer';
import AppError from '@utils/appError';
import catchAsync from '@utils/catchAsync';
import { NextFunction, Response, Request } from 'express';
import sharp from 'sharp';
const multerStorage = multer.memoryStorage();

const multerFilter: any = (
  req: Request,
  file: Express.Multer.File,
  cb: any
): void => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new AppError(400, 'Not an image! Please upload only images.'), false);
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

export const uploadUserPhoto = upload.single('photo');

export const resizeUserImage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next();
    if (!req.file) return next();
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpg`;

    await sharp(req.file.buffer)
      .resize(128, 128)
      .toFormat('jpg')
      .jpeg({ quality: 90 })
      .toFile(`${__dirname}/../public/img/users/${req.file.filename}`);
    next();
  }
);
