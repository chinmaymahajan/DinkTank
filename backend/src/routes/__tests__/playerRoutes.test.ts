import request from 'supertest';
import express from 'express';
import playerRoutes from '../playerRoutes';
import { playerService } from '../../services/PlayerService';
import { leagueService } from '../../services/LeagueService';
import { dataStore } from '../../data/DataStore';

// Create a test app
const app = express();
app.use(express.json());
app.use('/api', playerRoutes);

describe('Player API Routes', () => {
  let testLeagueId: string;

  beforeEach(() => {
    // Clear data store before each test
    dataStore.clear();
    
    // Create a test league for player operations
    const league = leagueService.createLeague('Test League');
    testLeagueId = league.id;
  });

  describe('POST /api/leagues/:leagueId/players', () => {
    it('should add a new player with valid name', async () => {
      const response = await request(app)
        .post(`/api/leagues/${testLeagueId}/players`)
        .send({ name: 'John Doe' })
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'John Doe',
        leagueId: testLeagueId,
        id: expect.any(String),
        createdAt: expect.any(String)
      });
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(app)
        .post(`/api/leagues/${testLeagueId}/players`)
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Player name is required and must be a string'
        }
      });
    });

    it('should return 400 when name is not a string', async () => {
      const response = await request(app)
        .post(`/api/leagues/${testLeagueId}/players`)
        .send({ name: 123 })
        .expect(400);

      expect(response.body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Player name is required and must be a string'
        }
      });
    });

    it('should return 400 when name is empty', async () => {
      const response = await request(app)
        .post(`/api/leagues/${testLeagueId}/players`)
        .send({ name: '' })
        .expect(400);

      expect(response.body.error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: expect.stringContaining('cannot be empty')
      });
    });

    it('should return 400 when name is only whitespace', async () => {
      const response = await request(app)
        .post(`/api/leagues/${testLeagueId}/players`)
        .send({ name: '   ' })
        .expect(400);

      expect(response.body.error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: expect.stringContaining('cannot be empty')
      });
    });

    it('should trim whitespace from player name', async () => {
      const response = await request(app)
        .post(`/api/leagues/${testLeagueId}/players`)
        .send({ name: '  Jane Smith  ' })
        .expect(201);

      expect(response.body.name).toBe('Jane Smith');
    });
  });

  describe('GET /api/leagues/:leagueId/players', () => {
    it('should return empty array when no players exist', async () => {
      const response = await request(app)
        .get(`/api/leagues/${testLeagueId}/players`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all players for a specific league', async () => {
      // Add test players
      playerService.addPlayer(testLeagueId, 'Player 1');
      playerService.addPlayer(testLeagueId, 'Player 2');
      playerService.addPlayer(testLeagueId, 'Player 3');

      const response = await request(app)
        .get(`/api/leagues/${testLeagueId}/players`)
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toMatchObject({ name: 'Player 1', leagueId: testLeagueId });
      expect(response.body[1]).toMatchObject({ name: 'Player 2', leagueId: testLeagueId });
      expect(response.body[2]).toMatchObject({ name: 'Player 3', leagueId: testLeagueId });
    });

    it('should only return players for the specified league', async () => {
      // Create another league
      const league2 = leagueService.createLeague('League 2');
      
      // Add players to both leagues
      playerService.addPlayer(testLeagueId, 'League 1 Player');
      playerService.addPlayer(league2.id, 'League 2 Player');

      const response = await request(app)
        .get(`/api/leagues/${testLeagueId}/players`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('League 1 Player');
    });
  });

  describe('End-to-end flow', () => {
    it('should add multiple players and retrieve them', async () => {
      // Add first player
      const player1Response = await request(app)
        .post(`/api/leagues/${testLeagueId}/players`)
        .send({ name: 'Alice' })
        .expect(201);

      const player1Id = player1Response.body.id;

      // Add second player
      const player2Response = await request(app)
        .post(`/api/leagues/${testLeagueId}/players`)
        .send({ name: 'Bob' })
        .expect(201);

      const player2Id = player2Response.body.id;

      // Get all players
      const listResponse = await request(app)
        .get(`/api/leagues/${testLeagueId}/players`)
        .expect(200);

      expect(listResponse.body).toHaveLength(2);
      expect(listResponse.body.map((p: any) => p.id)).toContain(player1Id);
      expect(listResponse.body.map((p: any) => p.id)).toContain(player2Id);
      expect(listResponse.body.map((p: any) => p.name)).toContain('Alice');
      expect(listResponse.body.map((p: any) => p.name)).toContain('Bob');
    });
  });
});
