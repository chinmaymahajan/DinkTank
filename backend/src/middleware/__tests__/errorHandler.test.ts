import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError } from '../errorHandler';

describe('errorHandler middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      headersSent: false
    };
    mockNext = jest.fn();
  });

  describe('AppError handling', () => {
    it('should handle AppError with correct status and format', () => {
      const error = new AppError(400, 'VALIDATION_ERROR', 'Invalid input', { field: 'name' });

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: { field: 'name' }
        }
      });
    });

    it('should handle AppError without details', () => {
      const error = new AppError(404, 'NOT_FOUND', 'Resource not found');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
          details: undefined
        }
      });
    });
  });

  describe('Validation error handling', () => {
    it('should handle empty name validation error', () => {
      const error = new Error('Player name cannot be empty');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Player name cannot be empty'
        }
      });
    });

    it('should handle empty identifier validation error', () => {
      const error = new Error('Court identifier cannot be empty');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Court identifier cannot be empty'
        }
      });
    });
  });

  describe('Not found error handling', () => {
    it('should handle player not found error', () => {
      const error = new Error('Player not found');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Player not found'
        }
      });
    });

    it('should handle league not found error', () => {
      const error = new Error('League not found');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'League not found'
        }
      });
    });

    it('should handle round not found error', () => {
      const error = new Error('Round not found');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Round not found'
        }
      });
    });
  });

  describe('Business logic error handling', () => {
    it('should handle no players error', () => {
      const error = new Error('Cannot generate round: no players in league');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'BUSINESS_LOGIC_ERROR',
          message: 'Cannot generate round: no players in league'
        }
      });
    });

    it('should handle no courts error', () => {
      const error = new Error('Cannot generate round: no courts in league');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'BUSINESS_LOGIC_ERROR',
          message: 'Cannot generate round: no courts in league'
        }
      });
    });

    it('should handle duplicate round number error', () => {
      const error = new Error('Round number already exists');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'BUSINESS_LOGIC_ERROR',
          message: 'Round number already exists'
        }
      });
    });

    it('should handle capacity issue error', () => {
      const error = new Error('Court capacity issue detected');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'BUSINESS_LOGIC_ERROR',
          message: 'Court capacity issue detected'
        }
      });
    });
  });

  describe('Generic error handling', () => {
    it('should handle unknown errors with 500 status', () => {
      const error = new Error('Something went wrong');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: undefined
        }
      });
    });

    it('should include error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Database connection failed');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: 'Database connection failed'
        }
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Headers already sent', () => {
    it('should delegate to next if headers already sent', () => {
      mockResponse.headersSent = true;
      const error = new Error('Test error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });
  });
});
