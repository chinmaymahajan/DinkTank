import request from 'supertest';
import express from 'express';
import roundRoutes from '../roundRoutes';
import { leagueService } from '../../services/LeagueService';
import { playerService } from '../../services/PlayerService';
import { courtService } from '../../services/CourtService';
import { dataStore } from '../../data/DataStore';

// Create a test app
const app = express();
app.use(express.json());
app.use('/api', roundRoutes);

describe('Round API Routes', () => {
  let testLeagueId: string;

  beforeEach(() => {
    // Clear data store before each test
    dataStore.clear();
    
    // Create a test league
    const league = leagueService.createLeague('Test League');
    testLeagueId = league.id;
  });

  describe('POST /api/leagues/:leagueId/rounds', () => {
    it('should generate a new round with valid players and courts', async () => {
      // Add players and courts
      playerService.addPlayer(testLeagueId, 'Player 1');
      playerService.addPlayer(testLeagueId, 'Player 2');
      playerService.addPlayer(testLeagueId, 'Player 3');
      playerService.addPlayer(testLeagueId, 'Player 4');
      courtService.addCourt(testLeagueId, 'Court 1');

      const response = await request(app)
        .post(`/api/leagues/${testLeagueId}/rounds`)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        leagueId: testLeagueId,
        roundNumber: 1,
        createdAt: expect.any(String)
      });
    });

    it('should generate sequential round numbers', async () => {
      // Add players and courts
      playerService.addPlayer(testLeagueId, 'Player 1');
      playerService.addPlayer(testLeagueId, 'Player 2');
      courtService.addCourt(testLeagueId, 'Court 1');

      // Generate first round
      const round1Response = await request(app)
        .post(`/api/leagues/${testLeagueId}/rounds`)
        .expect(201);

      expect(round1Response.body.roundNumber).toBe(1);

      // Generate second round
      const round2Response = await request(app)
        .post(`/api/leagues/${testLeagueId}/rounds`)
        .expect(201);

      expect(round2Response.body.roundNumber).toBe(2);

      // Generate third round
      const round3Response = await request(app)
        .post(`/api/leagues/${testLeagueId}/rounds`)
        .expect(201);

      expect(round3Response.body.roundNumber).toBe(3);
    });

    it('should return 400 when no players exist', async () => {
      // Add only courts, no players
      courtService.addCourt(testLeagueId, 'Court 1');

      const response = await request(app)
        .post(`/api/leagues/${testLeagueId}/rounds`)
        .expect(400);

      expect(response.body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Cannot generate round: no players in league'
        }
      });
    });

    it('should return 400 when no courts exist', async () => {
      // Add only players, no courts
      playerService.addPlayer(testLeagueId, 'Player 1');
      playerService.addPlayer(testLeagueId, 'Player 2');

      const response = await request(app)
        .post(`/api/leagues/${testLeagueId}/rounds`)
        .expect(400);

      expect(response.body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Cannot generate round: no courts in league'
        }
      });
    });
  });

  describe('GET /api/leagues/:leagueId/rounds', () => {
    it('should return empty array when no rounds exist', async () => {
      const response = await request(app)
        .get(`/api/leagues/${testLeagueId}/rounds`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all rounds for a league', async () => {
      // Add players and courts
      playerService.addPlayer(testLeagueId, 'Player 1');
      playerService.addPlayer(testLeagueId, 'Player 2');
      courtService.addCourt(testLeagueId, 'Court 1');

      // Generate multiple rounds
      await request(app).post(`/api/leagues/${testLeagueId}/rounds`);
      await request(app).post(`/api/leagues/${testLeagueId}/rounds`);
      await request(app).post(`/api/leagues/${testLeagueId}/rounds`);

      const response = await request(app)
        .get(`/api/leagues/${testLeagueId}/rounds`)
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0].roundNumber).toBe(1);
      expect(response.body[1].roundNumber).toBe(2);
      expect(response.body[2].roundNumber).toBe(3);
    });

    it('should only return rounds for the specified league', async () => {
      // Create another league
      const league2 = leagueService.createLeague('League 2');
      
      // Add players and courts to both leagues
      playerService.addPlayer(testLeagueId, 'Player 1');
      courtService.addCourt(testLeagueId, 'Court 1');
      playerService.addPlayer(league2.id, 'Player 2');
      courtService.addCourt(league2.id, 'Court 2');

      // Generate rounds for both leagues
      await request(app).post(`/api/leagues/${testLeagueId}/rounds`);
      await request(app).post(`/api/leagues/${league2.id}/rounds`);

      const response = await request(app)
        .get(`/api/leagues/${testLeagueId}/rounds`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].leagueId).toBe(testLeagueId);
    });
  });

  describe('GET /api/leagues/:leagueId/rounds/current', () => {
    it('should return the most recent round', async () => {
      // Add players and courts
      playerService.addPlayer(testLeagueId, 'Player 1');
      playerService.addPlayer(testLeagueId, 'Player 2');
      courtService.addCourt(testLeagueId, 'Court 1');

      // Generate multiple rounds
      await request(app).post(`/api/leagues/${testLeagueId}/rounds`);
      await request(app).post(`/api/leagues/${testLeagueId}/rounds`);
      const round3Response = await request(app).post(`/api/leagues/${testLeagueId}/rounds`);

      const response = await request(app)
        .get(`/api/leagues/${testLeagueId}/rounds/current`)
        .expect(200);

      expect(response.body.id).toBe(round3Response.body.id);
      expect(response.body.roundNumber).toBe(3);
    });

    it('should return 404 when no rounds exist', async () => {
      const response = await request(app)
        .get(`/api/leagues/${testLeagueId}/rounds/current`)
        .expect(404);

      expect(response.body).toEqual({
        error: {
          code: 'NOT_FOUND',
          message: 'No rounds found for league'
        }
      });
    });
  });

  describe('GET /api/leagues/:leagueId/rounds/:roundNumber', () => {
    it('should return a specific round by round number', async () => {
      // Add players and courts
      playerService.addPlayer(testLeagueId, 'Player 1');
      playerService.addPlayer(testLeagueId, 'Player 2');
      courtService.addCourt(testLeagueId, 'Court 1');

      // Generate multiple rounds
      await request(app).post(`/api/leagues/${testLeagueId}/rounds`);
      const round2Response = await request(app).post(`/api/leagues/${testLeagueId}/rounds`);
      await request(app).post(`/api/leagues/${testLeagueId}/rounds`);

      const response = await request(app)
        .get(`/api/leagues/${testLeagueId}/rounds/2`)
        .expect(200);

      expect(response.body.id).toBe(round2Response.body.id);
      expect(response.body.roundNumber).toBe(2);
    });

    it('should return 404 when round does not exist', async () => {
      const response = await request(app)
        .get(`/api/leagues/${testLeagueId}/rounds/99`)
        .expect(404);

      expect(response.body).toEqual({
        error: {
          code: 'NOT_FOUND',
          message: 'Round not found'
        }
      });
    });

    it('should return 400 when round number is not a positive integer', async () => {
      const response = await request(app)
        .get(`/api/leagues/${testLeagueId}/rounds/0`)
        .expect(400);

      expect(response.body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Round number must be a positive integer'
        }
      });
    });

    it('should return 400 when round number is negative', async () => {
      const response = await request(app)
        .get(`/api/leagues/${testLeagueId}/rounds/-1`)
        .expect(400);

      expect(response.body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Round number must be a positive integer'
        }
      });
    });

    it('should return 400 when round number is not a number', async () => {
      const response = await request(app)
        .get(`/api/leagues/${testLeagueId}/rounds/abc`)
        .expect(400);

      expect(response.body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Round number must be a positive integer'
        }
      });
    });
  });

  describe('End-to-end flow', () => {
    it('should generate rounds, list them, and retrieve specific rounds', async () => {
      // Setup league with players and courts
      playerService.addPlayer(testLeagueId, 'Player 1');
      playerService.addPlayer(testLeagueId, 'Player 2');
      playerService.addPlayer(testLeagueId, 'Player 3');
      playerService.addPlayer(testLeagueId, 'Player 4');
      courtService.addCourt(testLeagueId, 'Court 1');

      // Generate first round
      const round1Response = await request(app)
        .post(`/api/leagues/${testLeagueId}/rounds`)
        .expect(201);

      expect(round1Response.body.roundNumber).toBe(1);

      // Generate second round
      const round2Response = await request(app)
        .post(`/api/leagues/${testLeagueId}/rounds`)
        .expect(201);

      expect(round2Response.body.roundNumber).toBe(2);

      // List all rounds
      const listResponse = await request(app)
        .get(`/api/leagues/${testLeagueId}/rounds`)
        .expect(200);

      expect(listResponse.body).toHaveLength(2);

      // Get current round
      const currentResponse = await request(app)
        .get(`/api/leagues/${testLeagueId}/rounds/current`)
        .expect(200);

      expect(currentResponse.body.roundNumber).toBe(2);
      expect(currentResponse.body.id).toBe(round2Response.body.id);

      // Get specific round
      const specificResponse = await request(app)
        .get(`/api/leagues/${testLeagueId}/rounds/1`)
        .expect(200);

      expect(specificResponse.body.roundNumber).toBe(1);
      expect(specificResponse.body.id).toBe(round1Response.body.id);
    });
  });

  describe('PUT /api/rounds/:roundId/assignments', () => {
    it('should update assignments with manual reassignments', async () => {
      // Setup league with players and courts
      const player1 = playerService.addPlayer(testLeagueId, 'Player 1');
      const player2 = playerService.addPlayer(testLeagueId, 'Player 2');
      const player3 = playerService.addPlayer(testLeagueId, 'Player 3');
      const player4 = playerService.addPlayer(testLeagueId, 'Player 4');
      const court1 = courtService.addCourt(testLeagueId, 'Court 1');

      // Generate a round
      const roundResponse = await request(app)
        .post(`/api/leagues/${testLeagueId}/rounds`)
        .expect(201);

      const roundId = roundResponse.body.id;

      // Manually reassign players
      const manualAssignments = [
        {
          courtId: court1.id,
          team1PlayerIds: [player1.id, player2.id],
          team2PlayerIds: [player3.id, player4.id]
        }
      ];

      const response = await request(app)
        .put(`/api/rounds/${roundId}/assignments`)
        .send({ assignments: manualAssignments })
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        roundId,
        courtId: court1.id,
        team1PlayerIds: [player1.id, player2.id],
        team2PlayerIds: [player3.id, player4.id]
      });
    });

    it('should preserve non-overridden assignments', async () => {
      // Setup league with players and courts
      const player1 = playerService.addPlayer(testLeagueId, 'Player 1');
      const player2 = playerService.addPlayer(testLeagueId, 'Player 2');
      const player3 = playerService.addPlayer(testLeagueId, 'Player 3');
      const player4 = playerService.addPlayer(testLeagueId, 'Player 4');
      const player5 = playerService.addPlayer(testLeagueId, 'Player 5');
      const player6 = playerService.addPlayer(testLeagueId, 'Player 6');
      const player7 = playerService.addPlayer(testLeagueId, 'Player 7');
      const player8 = playerService.addPlayer(testLeagueId, 'Player 8');
      const court1 = courtService.addCourt(testLeagueId, 'Court 1');
      const court2 = courtService.addCourt(testLeagueId, 'Court 2');

      // Generate a round with 2 courts
      const roundResponse = await request(app)
        .post(`/api/leagues/${testLeagueId}/rounds`)
        .expect(201);

      const roundId = roundResponse.body.id;

      // Only override assignments for court1
      const manualAssignments = [
        {
          courtId: court1.id,
          team1PlayerIds: [player1.id, player2.id],
          team2PlayerIds: [player3.id, player4.id]
        }
      ];

      const response = await request(app)
        .put(`/api/rounds/${roundId}/assignments`)
        .send({ assignments: manualAssignments })
        .expect(200);

      // Should have 2 assignments (one overridden, one preserved)
      expect(response.body).toHaveLength(2);
      
      // Find the court1 assignment
      const court1Assignment = response.body.find((a: any) => a.courtId === court1.id);
      expect(court1Assignment).toMatchObject({
        courtId: court1.id,
        team1PlayerIds: [player1.id, player2.id],
        team2PlayerIds: [player3.id, player4.id]
      });

      // Court2 assignment should still exist
      const court2Assignment = response.body.find((a: any) => a.courtId === court2.id);
      expect(court2Assignment).toBeDefined();
      expect(court2Assignment.courtId).toBe(court2.id);
    });

    it('should return 400 when assignments is not an array', async () => {
      const response = await request(app)
        .put('/api/rounds/some-round-id/assignments')
        .send({ assignments: 'not-an-array' })
        .expect(400);

      expect(response.body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body must include an "assignments" array'
        }
      });
    });

    it('should return 400 when assignments is missing', async () => {
      const response = await request(app)
        .put('/api/rounds/some-round-id/assignments')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body must include an "assignments" array'
        }
      });
    });

    it('should return 400 when assignment is missing required fields', async () => {
      const response = await request(app)
        .put('/api/rounds/some-round-id/assignments')
        .send({
          assignments: [
            {
              courtId: 'court-1'
              // Missing team1PlayerIds and team2PlayerIds
            }
          ]
        })
        .expect(400);

      expect(response.body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Each assignment must include courtId, team1PlayerIds, and team2PlayerIds'
        }
      });
    });

    it('should return 400 when team player IDs are not arrays', async () => {
      const response = await request(app)
        .put('/api/rounds/some-round-id/assignments')
        .send({
          assignments: [
            {
              courtId: 'court-1',
              team1PlayerIds: 'not-an-array',
              team2PlayerIds: ['player-1']
            }
          ]
        })
        .expect(400);

      expect(response.body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'team1PlayerIds and team2PlayerIds must be arrays'
        }
      });
    });

    it('should return 404 when court does not exist', async () => {
      // Setup league with players
      const player1 = playerService.addPlayer(testLeagueId, 'Player 1');
      const player2 = playerService.addPlayer(testLeagueId, 'Player 2');
      const player3 = playerService.addPlayer(testLeagueId, 'Player 3');
      const player4 = playerService.addPlayer(testLeagueId, 'Player 4');
      courtService.addCourt(testLeagueId, 'Court 1');

      // Generate a round
      const roundResponse = await request(app)
        .post(`/api/leagues/${testLeagueId}/rounds`)
        .expect(201);

      const roundId = roundResponse.body.id;

      // Try to assign to non-existent court
      const manualAssignments = [
        {
          courtId: 'non-existent-court',
          team1PlayerIds: [player1.id, player2.id],
          team2PlayerIds: [player3.id, player4.id]
        }
      ];

      const response = await request(app)
        .put(`/api/rounds/${roundId}/assignments`)
        .send({ assignments: manualAssignments })
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('Court not found');
    });

    it('should return 404 when player does not exist', async () => {
      // Setup league with players and courts
      const player1 = playerService.addPlayer(testLeagueId, 'Player 1');
      const player2 = playerService.addPlayer(testLeagueId, 'Player 2');
      const court1 = courtService.addCourt(testLeagueId, 'Court 1');

      // Generate a round
      const roundResponse = await request(app)
        .post(`/api/leagues/${testLeagueId}/rounds`)
        .expect(201);

      const roundId = roundResponse.body.id;

      // Try to assign non-existent player
      const manualAssignments = [
        {
          courtId: court1.id,
          team1PlayerIds: [player1.id, player2.id],
          team2PlayerIds: ['non-existent-player', 'another-fake-player']
        }
      ];

      const response = await request(app)
        .put(`/api/rounds/${roundId}/assignments`)
        .send({ assignments: manualAssignments })
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('Player not found');
    });
  });

  describe('GET /api/rounds/:roundId/assignments', () => {
    it('should return assignments for a specific round', async () => {
      // Setup league with players and courts
      playerService.addPlayer(testLeagueId, 'Player 1');
      playerService.addPlayer(testLeagueId, 'Player 2');
      playerService.addPlayer(testLeagueId, 'Player 3');
      playerService.addPlayer(testLeagueId, 'Player 4');
      courtService.addCourt(testLeagueId, 'Court 1');

      // Generate a round
      const roundResponse = await request(app)
        .post(`/api/leagues/${testLeagueId}/rounds`)
        .expect(201);

      const roundId = roundResponse.body.id;

      // Get assignments
      const response = await request(app)
        .get(`/api/rounds/${roundId}/assignments`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toMatchObject({
        id: expect.any(String),
        roundId: roundId,
        courtId: expect.any(String),
        team1PlayerIds: expect.any(Array),
        team2PlayerIds: expect.any(Array),
        createdAt: expect.any(String)
      });
    });

    it('should return empty array for round with no assignments', async () => {
      const response = await request(app)
        .get('/api/rounds/non-existent-round/assignments')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });
});
