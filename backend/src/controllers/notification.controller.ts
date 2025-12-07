import catchAsync from '@utils/catchAsync';
import { NextFunction, Request, Response } from 'express';
import {
  createOne,
  getAll,
  getOne,
  updateOne,
  deleteOne,
} from './handlerFactory';
import Notification from '@models/notification.model';

export const updateCAndMNotifications = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let { chatId } = req.params;
    if (!chatId) chatId = req.body.chat;
    if (!req.user) {
      return next(new Error('User not authenticated'));
    }
    const userId = (req.user as any).id || (req.user as any)._id;
    if (!userId) {
      return next(new Error('User ID not found'));
    }
    const result = await Notification.updateMany(
      { chat: chatId, user: userId, read: false },
      { read: true }
    );
    res.status(200).json({ status: 'success' });
  }
);
export const getAllNotification = getAll(Notification);
export const createNotification = createOne(Notification);
export const getNotification = getOne(Notification);
export const updateNotification = updateOne(Notification);
export const deleteNotification = deleteOne(Notification);
