import { Request, Response, NextFunction } from 'express';
import catchAsync from '@utils/catchAsync';
import Chat from '@models/chat.model';
import AppError from '@utils/appError';
import { IChat } from '../types/chat.type';

import {
  createOne,
  getOne,
  deleteOne,
  updateOne,
} from '@controllers/handlerFactory';

export const accessChat = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.body;
    if (!userId)
      return next(new AppError(400, 'please send user id with request'));
    const isChat = await Chat.findOne({
      isGroup: false,
      $and: [
        { users: { $elemMatch: { $eq: userId } } },
        { users: { $elemMatch: { $eq: req.user?._id } } },
      ],
    });
    if (isChat) {
      return res.status(200).json({ data: isChat });
    }
    const chatData: any = {
      isGroup: false,
      users: [req.user?.id, userId],
      name: 'Sender',
    };
    const createdChat = await Chat.create(chatData);
    res.status(201).json({ status: 'success', data: createdChat });
  }
);

export const getAllChats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const chats = await Chat.find({
      users: { $elemMatch: { $eq: req.user?._id } },
    }).sort({ updatedAt: -1 });
    res
      .status(200)
      .json({ status: 'success', result: chats.length, data: chats });
  }
);

export const createGroupChat = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { users, name } = req.body;
    if (!users || !name)
      return next(new AppError(400, 'Please provide users and group name'));

    users.push(req.user?._id);
    const chatData: any = {
      users,
      name,
      isGroup: true,
      groupAdmin: req.user?._id,
    };
    const chatGroup = await Chat.create(chatData);
    chatGroup.createNotification(users);
    res.status(201).json({ status: 'success', data: chatGroup });
  }
);

export const renameGroup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { chatId, name } = req.body;
    const chat = await Chat.findByIdAndUpdate(
      chatId,
      { name },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!chat) {
      return next(new AppError(404, `No chat found with that ID`));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: chat,
      },
    });
  }
);

export const addToGroup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { chatId, userId } = req.body;
    const chat = await Chat.findByIdAndUpdate(
      chatId,
      { $push: { users: userId } },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!chat) {
      return next(new AppError(404, `No chat found with that ID`));
    }

    let users: any = [userId];

    chat.createNotification(users);

    res.status(200).json({
      status: 'success',
      data: {
        data: chat,
      },
    });
  }
);

export const removeFromGroup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { chatId, userId } = req.body;
    const chat = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { users: userId } },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!chat) {
      return next(new AppError(404, `No chat found with that ID`));
    }

    if (userId === chat.groupAdmin?.id) {
      chat.groupAdmin = chat.users[0];
      await chat.save({ validateBeforeSave: false });
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: chat,
      },
    });
  }
);
// export const getAllChats = getAll(Chat);
export const getChat = getOne(Chat);
export const CreateChat = createOne(Chat);
export const updateChat = updateOne(Chat);
export const deleteChat = deleteOne(Chat);
