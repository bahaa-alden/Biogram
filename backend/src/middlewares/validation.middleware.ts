import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import AppError from '@utils/appError';
import catchAsync from '@utils/catchAsync';

type ValidationTarget = 'body' | 'params' | 'query';

interface ValidationSchema {
  body?: ZodSchema<any, any, any>;
  params?: ZodSchema<any, any, any>;
  query?: ZodSchema<any, any, any>;
}

export const validate = (schema: ValidationSchema) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.params) {
        req.params = (await schema.params.parseAsync(req.params)) as Record<string, string>;
      }
      if (schema.query) {
        req.query = (await schema.query.parseAsync(req.query)) as Record<string, any>;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue) => {
          const path = issue.path.join('.') || 'root';
          return `${path}: ${issue.message}`;
        });
        return next(
          new AppError(
            400,
            `Validation failed: ${errorMessages.join('; ')}`
          )
        );
      }
      next(error);
    }
  });
};

// Helper function to validate a single target
export const validateTarget = (
  target: ValidationTarget,
  schema: ZodSchema<any, any, any>
) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = target === 'body' ? req.body : target === 'params' ? req.params : req.query;
      const validated = await schema.parseAsync(data);
      
      if (target === 'body') {
        req.body = validated;
      } else if (target === 'params') {
        req.params = validated as Record<string, string>;
      } else {
        req.query = validated as Record<string, any>;
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue) => {
          const path = issue.path.join('.') || 'root';
          return `${path}: ${issue.message}`;
        });
        return next(
          new AppError(
            400,
            `Validation failed: ${errorMessages.join('; ')}`
          )
        );
      }
      next(error);
    }
  });
};

