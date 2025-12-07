import Message from '@models/message.model';
import { NextFunction, Request, Response } from 'express';

import {
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from '@controllers/handlerFactory';

export const setSenderAndChat = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.body.chat) req.body.chat = req.params.chatId;
  req.body.sender = req.user?.id;

  next();
};

export const getAllMessages = getAll(Message);
export const getMessage = getOne(Message);

export const CreateMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const doc = await Message.create(req.body);

    // The post-save hook already populates sender and chat, but ensure users are populated
    await doc.populate({
      path: 'sender',
      select: 'name photo email _id',
    });
    await doc.populate({
      path: 'chat',
      select: { lastMessage: 0 },
      populate: {
        path: 'users',
        select: 'name photo email _id',
      },
    });

    res.status(201).json({
      status: 'success',
      data: { data: doc },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMessage = updateOne(Message);
export const deleteMessage = deleteOne(Message);
