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
    const result = await Notification.updateMany(
      { chat: chatId, user: req.user?.id, read: false },
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
