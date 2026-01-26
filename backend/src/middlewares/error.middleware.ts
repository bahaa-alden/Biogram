import { NextFunction, Request, Response } from 'express';
import AppError from '../utils/appError';
import logger from '../utils/logger';

interface MongoError extends Error {
  path?: string;
  value?: string;
  code?: number;
  errmsg?: string;
  errors?: Record<string, { message: string }>;
}

const handleCastErrorDB = (err: MongoError): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(400, message);
};

const handleDuplicateErrorDB = (err: MongoError): AppError => {
  if (err.errmsg?.includes('reviews')) {
    const message = 'You can have only one review';
    return new AppError(400, message);
  }
  const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0] || 'value';
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(400, message);
};

const handleValidatorErrorDB = (err: MongoError): AppError => {
  const messages = err.errors
    ? Object.values(err.errors).map((el: { message: string }) => el.message)
    : ['Invalid input data'];
  const message = `Invalid input data. ${messages.join('. ')}`;
  return new AppError(400, message);
};

const handleJWTError = (): AppError =>
  new AppError(401, 'Invalid token, please log in again');

const handleJWTExpiredError = (): AppError =>
  new AppError(401, 'Your token has expired!, please log in again');

const handlePassportError = (): AppError =>
  new AppError(401, 'You are not logged in, please log in to get access.');

/**
 * Send error response in development mode
 */
const sendErrorDev = (err: AppError | Error, req: Request, res: Response): void => {
  const statusCode = (err as AppError).statusCode || 500;
  const status = (err as AppError).status || 'error';

  logger.error('Error in development', err, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  res.status(statusCode).json({
    status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

/**
 * Send error response in production mode
 */
const sendErrorProd = (err: AppError | Error, req: Request, res: Response): void => {
  const statusCode = (err as AppError).statusCode || 500;
  const status = (err as AppError).status || 'error';

  // Operational, trusted errors: send message to the client
  if ((err as AppError).isOperational) {
    logger.warn('Operational error', {
      statusCode,
      message: err.message,
      url: req.originalUrl,
      method: req.method,
    });

    res.status(statusCode).json({
      status,
      message: err.message,
    });
    return;
  }

  // Programming or other unknown error: don't leak details
  logger.error('Programming or unknown error', err, {
    statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    body: req.body,
  });

  // Send generic message
  res.status(500).json({
    status: 'error',
    message: 'Something went very wrong',
  });
};

/**
 * Global error handler middleware
 */
const globalErrorHandler = (
  err: AppError | Error | MongoError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Set default status code and status
  const error = err as AppError;
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let processedError: AppError = error;

    // Handle specific error types
    if (error.name === 'CastError') {
      processedError = handleCastErrorDB(error as MongoError);
    } else if ((error as MongoError).code === 11000) {
      processedError = handleDuplicateErrorDB(error as MongoError);
    } else if (error.name === 'ValidationError') {
      processedError = handleValidatorErrorDB(error as MongoError);
    } else if (error.name === 'JsonWebTokenError') {
      processedError = handleJWTError();
    } else if (error.name === 'TokenExpiredError') {
      processedError = handleJWTExpiredError();
    } else if (error.message === 'Unauthorized') {
      processedError = handlePassportError();
    }

    sendErrorProd(processedError, req, res);
  }
};

/**
 * Handle 404 errors
 */
const notFound = (req: Request, res: Response, next: NextFunction): void => {
  logger.warn('Route not found', {
    url: req.originalUrl,
    method: req.method,
  });

  return next(
    new AppError(404, `Can't find ${req.originalUrl} on this server`)
  );
};

export { globalErrorHandler, notFound };
