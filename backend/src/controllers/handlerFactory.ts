import { NextFunction, Request, Response } from 'express';
import { Document, Model, PopulateOptions } from 'mongoose';
import APIFeatures from '../utils/apiFeatures';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';

/**
 * Delete a document by ID
 */
export const deleteOne = <T extends Document>(Model: Model<T>) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    const modelName = Model.modelName.toLowerCase();
    
    if (!doc) {
      return next(new AppError(404, `No ${modelName} found with that ID`));
    }
    
    res.status(204).json({ status: 'success', data: null });
  });

/**
 * Update a document by ID
 */
export const updateOne = <T extends Document>(Model: Model<T>) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    const modelName = Model.modelName.toLowerCase();
    
    if (!doc) {
      return next(new AppError(404, `No ${modelName} found with that ID`));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

/**
 * Create a new document
 */
export const createOne = <T extends Document>(Model: Model<T>) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const newDoc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: newDoc,
      },
    });
  });

/**
 * Get a single document by ID with optional population
 */
export const getOne = <T extends Document>(
  Model: Model<T>,
  ...popOptions: PopulateOptions[]
) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let query: any = Model.findById(req.params.id);
    
    if (popOptions && popOptions.length > 0) {
      popOptions.forEach((pop) => {
        query = query.populate(pop);
      });
    }
    
    const doc = await query;
    const modelName = Model.modelName.toLowerCase();

    if (!doc) {
      return next(new AppError(404, `No ${modelName} with that ID`));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

/**
 * Get all documents with filtering, sorting, and pagination
 */
export const getAll = <T extends Document>(
  Model: Model<T>,
  isNotification: boolean = false
) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const filter: Record<string, unknown> = {};
    
    if (req.params.userId) {
      filter.user = req.params.userId;
    }
    if (req.params.chatId) {
      filter.chat = req.params.chatId;
    }

    const query =
      Model.modelName === 'User'
        ? Model.find({ _id: { $ne: req.user?.id } })
        : Model.find(filter);

    const feature = new APIFeatures(query, req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate()
      .search(req.querySearch || {});

    let docs = await feature.query;
    
    if (isNotification) {
      docs = docs.map((doc: T & { chat?: { isGroup?: boolean; name?: string; groupAdmin?: { name?: string }; users?: Array<{ id?: string; name?: string }> } }) => {
        const docObj = doc.toObject();
        
        if (doc.chat?.isGroup) {
          return {
            ...docObj,
            name: doc.chat.name,
            chatAdmin: doc.chat.groupAdmin?.name?.split(' ')[0],
          };
        }
        
        const receiverName =
          req.user?.id === doc.chat?.users?.[0]?.id
            ? doc.chat.users[1]?.name || 'Unknown'
            : doc.chat?.users?.[0]?.name || 'Unknown';
            
        return {
          ...docObj,
          receiverName,
        };
      });
    }
    
    if (req.query.reverse) {
      docs.reverse();
    }
    
    res.status(200).json({
      status: 'success',
      result: docs.length,
      data: {
        data: docs,
      },
    });
  });
