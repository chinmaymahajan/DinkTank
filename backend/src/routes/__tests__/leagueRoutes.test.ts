import request from 'supertest';
import express from 'express';
import leagueRoutes from '../leagueRoutes';
import { leagueService } from '../../services/LeagueService';
import { dataStore } from '../../data/DataStore';
import { LeagueFormat } from '../../models/League';

// Create a test app
const app = express();
app.use(express.json());
app.use('/api', leagueRoutes);

describe('League API Routes', () => {
  beforeEach(() => {
    // Clear data store before each test
    dataStore.clear();
    leagueService.clearSelection();
  });

  describe('POST /api/leagues', () => {
    it('should create a new league with valid name', async () => {
      const response = await request(app)
        .post('/api/leagues')
        .send({ name: 'Summer League' })
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'Summer League',
        format: LeagueFormat.ROUND_ROBIN,
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });

    it('should create a league with specified format', async () => {
      const response = await request(app)
        .post('/api/leagues')
        .send({ name: 'Tournament League', format: LeagueFormat.ROUND_ROBIN })
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'Tournament League',
        format: LeagueFormat.ROUND_ROBIN
      });
    });

    it('should return 400 when format is invalid', async () => {
      const response = await request(app)
        .post('/api/leagues')
        .send({ name: 'Test League', format: 'invalid_format' })
        .expect(400);

      expect(response.body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid league format'
        }
      });
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(app)
        .post('/api/leagues')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'League name is required and must be a string'
        }
      });
    });

    it('should return 400 when name is not a string', async () => {
      const response = await request(app)
        .post('/api/leagues')
        .send({ name: 123 })
        .expect(400);

      expect(response.body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'League name is required and must be a string'
        }
      });
    });
  });

  describe('GET /api/leagues', () => {
    it('should return empty array when no leagues exist', async () => {
      const response = await request(app)
        .get('/api/leagues')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all leagues', async () => {
      // Create test leagues
      leagueService.createLeague('League 1');
      leagueService.createLeague('League 2');
      leagueService.createLeague('League 3');

      const response = await request(app)
        .get('/api/leagues')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toMatchObject({ name: 'League 1' });
      expect(response.body[1]).toMatchObject({ name: 'League 2' });
      expect(response.body[2]).toMatchObject({ name: 'League 3' });
    });
  });

  describe('GET /api/leagues/:id', () => {
    it('should return a specific league by ID', async () => {
      const league = leagueService.createLeague('Test League');

      const response = await request(app)
        .get(`/api/leagues/${league.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: league.id,
        name: 'Test League'
      });
    });

    it('should return 404 when league does not exist', async () => {
      const response = await request(app)
        .get('/api/leagues/nonexistent-id')
        .expect(404);

      expect(response.body).toEqual({
        error: {
          code: 'NOT_FOUND',
          message: 'League not found'
        }
      });
    });
  });

  describe('POST /api/leagues/:id/select', () => {
    it('should select a league successfully', async () => {
      const league = leagueService.createLeague('Test League');

      const response = await request(app)
        .post(`/api/leagues/${league.id}/select`)
        .expect(200);

      expect(response.body).toEqual({
        message: 'League selected successfully',
        leagueId: league.id
      });

      // Verify the league was actually selected
      expect(leagueService.getSelectedLeagueId()).toBe(league.id);
    });

    it('should return 404 when trying to select non-existent league', async () => {
      const response = await request(app)
        .post('/api/leagues/nonexistent-id/select')
        .expect(404);

      expect(response.body).toEqual({
        error: {
          code: 'NOT_FOUND',
          message: 'League not found'
        }
      });
    });
  });

  describe('End-to-end flow', () => {
    it('should create, list, get, and select a league', async () => {
      // Create a league
      const createResponse = await request(app)
        .post('/api/leagues')
        .send({ name: 'E2E League' })
        .expect(201);

      const leagueId = createResponse.body.id;

      // List leagues
      const listResponse = await request(app)
        .get('/api/leagues')
        .expect(200);

      expect(listResponse.body).toHaveLength(1);
      expect(listResponse.body[0].id).toBe(leagueId);

      // Get specific league
      const getResponse = await request(app)
        .get(`/api/leagues/${leagueId}`)
        .expect(200);

      expect(getResponse.body.name).toBe('E2E League');

      // Select league
      const selectResponse = await request(app)
        .post(`/api/leagues/${leagueId}/select`)
        .expect(200);

      expect(selectResponse.body.leagueId).toBe(leagueId);
    });
  });
});
