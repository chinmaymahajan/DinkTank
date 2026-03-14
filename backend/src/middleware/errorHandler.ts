import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../models/ErrorResponse';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Centralized error handling middleware
 * Returns consistent ErrorResponse format for all errors
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If headers already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle AppError instances
  if (err instanceof AppError) {
    const errorResponse: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    };
    res.status(err.statusCode).json(errorResponse);
    return;
  }

  // Handle validation errors (empty name/identifier)
  if (err.message.includes('cannot be empty')) {
    const errorResponse: ErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message
      }
    };
    res.status(400).json(errorResponse);
    return;
  }

  // Handle not found errors
  if (err.message.includes('not found')) {
    const errorResponse: ErrorResponse = {
      error: {
        code: 'NOT_FOUND',
        message: err.message
      }
    };
    res.status(404).json(errorResponse);
    return;
  }

  // Handle business logic errors (insufficient courts, no players, etc.)
  if (
    err.message.includes('Cannot generate round') ||
    err.message.includes('already exists') ||
    err.message.includes('capacity issue')
  ) {
    const errorResponse: ErrorResponse = {
      error: {
        code: 'BUSINESS_LOGIC_ERROR',
        message: err.message
      }
    };
    res.status(400).json(errorResponse);
    return;
  }

  // Default to internal server error
  const errorResponse: ErrorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }
  };
  res.status(500).json(errorResponse);
}
