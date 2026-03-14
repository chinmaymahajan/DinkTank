import request from 'supertest';
import express from 'express';
import courtRoutes from '../courtRoutes';
import { courtService } from '../../services/CourtService';
import { leagueService } from '../../services/LeagueService';
import { dataStore } from '../../data/DataStore';

// Create a test app
const app = express();
app.use(express.json());
app.use('/api', courtRoutes);

describe('Court API Routes', () => {
  let testLeagueId: string;

  beforeEach(() => {
    // Clear data store before each test
    dataStore.clear();
    
    // Create a test league for court operations
    const league = leagueService.createLeague('Test League');
    testLeagueId = league.id;
  });

  describe('POST /api/leagues/:leagueId/courts', () => {
    it('should add a new court with valid identifier', async () => {
      const response = await request(app)
        .post(`/api/leagues/${testLeagueId}/courts`)
        .send({ identifier: 'Court 1' })
        .expect(201);

      expect(response.body).toMatchObject({
        identifier: 'Court 1',
        leagueId: testLeagueId,
        id: expect.any(String),
        createdAt: expect.any(String)
      });
    });

    it('should return 400 when identifier is missing', async () => {
      const response = await request(app)
        .post(`/api/leagues/${testLeagueId}/courts`)
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Court identifier is required and must be a string'
        }
      });
    });

    it('should return 400 when identifier is not a string', async () => {
      const response = await request(app)
        .post(`/api/leagues/${testLeagueId}/courts`)
        .send({ identifier: 123 })
        .expect(400);

      expect(response.body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Court identifier is required and must be a string'
        }
      });
    });

    it('should return 400 when identifier is empty', async () => {
      const response = await request(app)
        .post(`/api/leagues/${testLeagueId}/courts`)
        .send({ identifier: '' })
        .expect(400);

      expect(response.body.error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: expect.stringContaining('cannot be empty')
      });
    });

    it('should return 400 when identifier is only whitespace', async () => {
      const response = await request(app)
        .post(`/api/leagues/${testLeagueId}/courts`)
        .send({ identifier: '   ' })
        .expect(400);

      expect(response.body.error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: expect.stringContaining('cannot be empty')
      });
    });

    it('should trim whitespace from court identifier', async () => {
      const response = await request(app)
        .post(`/api/leagues/${testLeagueId}/courts`)
        .send({ identifier: '  Court A  ' })
        .expect(201);

      expect(response.body.identifier).toBe('Court A');
    });
  });

  describe('GET /api/leagues/:leagueId/courts', () => {
    it('should return empty array when no courts exist', async () => {
      const response = await request(app)
        .get(`/api/leagues/${testLeagueId}/courts`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all courts for a specific league', async () => {
      // Add test courts
      courtService.addCourt(testLeagueId, 'Court 1');
      courtService.addCourt(testLeagueId, 'Court 2');
      courtService.addCourt(testLeagueId, 'Court 3');

      const response = await request(app)
        .get(`/api/leagues/${testLeagueId}/courts`)
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toMatchObject({ identifier: 'Court 1', leagueId: testLeagueId });
      expect(response.body[1]).toMatchObject({ identifier: 'Court 2', leagueId: testLeagueId });
      expect(response.body[2]).toMatchObject({ identifier: 'Court 3', leagueId: testLeagueId });
    });

    it('should only return courts for the specified league', async () => {
      // Create another league
      const league2 = leagueService.createLeague('League 2');
      
      // Add courts to both leagues
      courtService.addCourt(testLeagueId, 'League 1 Court');
      courtService.addCourt(league2.id, 'League 2 Court');

      const response = await request(app)
        .get(`/api/leagues/${testLeagueId}/courts`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].identifier).toBe('League 1 Court');
    });
  });

  describe('End-to-end flow', () => {
    it('should add multiple courts and retrieve them', async () => {
      // Add first court
      const court1Response = await request(app)
        .post(`/api/leagues/${testLeagueId}/courts`)
        .send({ identifier: 'Court A' })
        .expect(201);

      const court1Id = court1Response.body.id;

      // Add second court
      const court2Response = await request(app)
        .post(`/api/leagues/${testLeagueId}/courts`)
        .send({ identifier: 'Court B' })
        .expect(201);

      const court2Id = court2Response.body.id;

      // Get all courts
      const listResponse = await request(app)
        .get(`/api/leagues/${testLeagueId}/courts`)
        .expect(200);

      expect(listResponse.body).toHaveLength(2);
      expect(listResponse.body.map((c: any) => c.id)).toContain(court1Id);
      expect(listResponse.body.map((c: any) => c.id)).toContain(court2Id);
      expect(listResponse.body.map((c: any) => c.identifier)).toContain('Court A');
      expect(listResponse.body.map((c: any) => c.identifier)).toContain('Court B');
    });
  });
});
