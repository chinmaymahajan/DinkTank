import { app, request, resetState, createLeague, addPlayers, addCourts, generateRound } from './helpers';

describe('Round Generation & Navigation API Integration Tests', () => {
  let leagueId: string;

  beforeEach(async () => {
    resetState();
    const res = await createLeague('Test League');
    leagueId = res.body.id;
    await addPlayers(leagueId, ['Alice', 'Bob', 'Charlie', 'Diana']);
    await addCourts(leagueId, ['Court 1']);
  });

  // B4.1 - Generate round with players and courts
  // Validates: Requirement 4.1
  it('should generate a round and return 201 with round object', async () => {
    const res = await generateRound(leagueId);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      leagueId,
      roundNumber: 1,
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
  });

  // B4.2 - List rounds sorted by roundNumber
  // Validates: Requirement 4.2
  it('should list rounds sorted by roundNumber ascending', async () => {
    await generateRound(leagueId);
    await generateRound(leagueId);
    await generateRound(leagueId);

    const res = await request(app).get(`/api/leagues/${leagueId}/rounds`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
    expect(res.body[0].roundNumber).toBe(1);
    expect(res.body[1].roundNumber).toBe(2);
    expect(res.body[2].roundNumber).toBe(3);
  });

  // B4.3 - Get round by valid roundNumber
  // Validates: Requirement 4.3
  it('should get a round by valid roundNumber and return 200', async () => {
    const genRes = await generateRound(leagueId);
    const roundNumber = genRes.body.roundNumber;

    const res = await request(app).get(`/api/leagues/${leagueId}/rounds/${roundNumber}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(genRes.body.id);
    expect(res.body.leagueId).toBe(leagueId);
    expect(res.body.roundNumber).toBe(roundNumber);
  });

  // B4.4 - Get round by non-existent number
  // Validates: Requirement 4.4
  it('should return 404 for a non-existent round number', async () => {
    await generateRound(leagueId);

    const res = await request(app).get(`/api/leagues/${leagueId}/rounds/999`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  // B4.5 - Get current round
  // Validates: Requirement 4.5
  it('should return the most recently generated round as current', async () => {
    await generateRound(leagueId);
    const secondRound = await generateRound(leagueId);

    const res = await request(app).get(`/api/leagues/${leagueId}/rounds/current`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(secondRound.body.id);
    expect(res.body.roundNumber).toBe(2);
  });

  // B4.6 - Get current round with no rounds
  // Validates: Requirement 4.6
  it('should return 404 for current round when no rounds exist', async () => {
    const res = await request(app).get(`/api/leagues/${leagueId}/rounds/current`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  // B4.7 - Generate round with no players
  // Validates: Requirement 4.7
  it('should return 400 when generating a round with no players', async () => {
    // Create a fresh league with courts but no players
    const freshLeague = await createLeague('Empty Players League');
    const freshLeagueId = freshLeague.body.id;
    await addCourts(freshLeagueId, ['Court A']);

    const res = await generateRound(freshLeagueId);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // B4.8 - Generate round with no courts
  // Validates: Requirement 4.8
  it('should return 400 when generating a round with no courts', async () => {
    // Create a fresh league with players but no courts
    const freshLeague = await createLeague('Empty Courts League');
    const freshLeagueId = freshLeague.body.id;
    await addPlayers(freshLeagueId, ['Eve', 'Frank', 'Grace', 'Hank']);

    const res = await generateRound(freshLeagueId);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // B4.9 - Clear all rounds
  // Validates: Requirement 4.9
  it('should clear all rounds and return 204', async () => {
    await generateRound(leagueId);
    await generateRound(leagueId);

    const deleteRes = await request(app).delete(`/api/leagues/${leagueId}/rounds`);
    expect(deleteRes.status).toBe(204);

    const listRes = await request(app).get(`/api/leagues/${leagueId}/rounds`);
    expect(listRes.status).toBe(200);
    expect(listRes.body).toEqual([]);
  });

  // B4.10 - Round numbers increment from 1
  // Validates: Requirement 4.10
  it('should assign incrementing round numbers starting from 1', async () => {
    const round1 = await generateRound(leagueId);
    const round2 = await generateRound(leagueId);
    const round3 = await generateRound(leagueId);

    expect(round1.body.roundNumber).toBe(1);
    expect(round2.body.roundNumber).toBe(2);
    expect(round3.body.roundNumber).toBe(3);
  });
});
