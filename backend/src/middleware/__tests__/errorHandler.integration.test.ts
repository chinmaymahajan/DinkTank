import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError } from '../errorHandler';

describe('errorHandler integration', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  it('should handle validation errors from routes', async () => {
    app.post('/test', (req: Request, res: Response, next: NextFunction) => {
      next(new Error('Player name cannot be empty'));
    });
    app.use(errorHandler);

    const response = await request(app)
      .post('/test')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Player name cannot be empty'
      }
    });
  });

  it('should handle not found errors from routes', async () => {
    app.get('/test/:id', (req: Request, res: Response, next: NextFunction) => {
      next(new Error('League not found'));
    });
    app.use(errorHandler);

    const response = await request(app).get('/test/123');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'League not found'
      }
    });
  });

  it('should handle business logic errors from routes', async () => {
    app.post('/test', (req: Request, res: Response, next: NextFunction) => {
      next(new Error('Cannot generate round: no players in league'));
    });
    app.use(errorHandler);

    const response = await request(app)
      .post('/test')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: 'BUSINESS_LOGIC_ERROR',
        message: 'Cannot generate round: no players in league'
      }
    });
  });

  it('should handle AppError instances from routes', async () => {
    app.post('/test', (req: Request, res: Response, next: NextFunction) => {
      next(new AppError(403, 'FORBIDDEN', 'Access denied', { reason: 'insufficient permissions' }));
    });
    app.use(errorHandler);

    const response = await request(app)
      .post('/test')
      .send({});

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied',
        details: { reason: 'insufficient permissions' }
      }
    });
  });

  it('should handle unexpected errors with 500 status', async () => {
    app.get('/test', (req: Request, res: Response, next: NextFunction) => {
      next(new Error('Unexpected database error'));
    });
    app.use(errorHandler);

    const response = await request(app).get('/test');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: undefined
      }
    });
  });

  it('should handle synchronous errors thrown in routes', async () => {
    app.get('/test', (req: Request, res: Response, next: NextFunction) => {
      throw new Error('Court not found');
    });
    app.use(errorHandler);

    const response = await request(app).get('/test');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Court not found'
      }
    });
  });
});
