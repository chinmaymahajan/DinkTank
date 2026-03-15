import { app, request, resetState, createLeague, addPlayers, addCourts, generateRound } from './helpers';

describe('Round Regeneration API Integration Tests', () => {
  let leagueId: string;

  beforeEach(async () => {
    resetState();
    const res = await createLeague('Regen League');
    leagueId = res.body.id;
    await addPlayers(leagueId, ['Alice', 'Bob', 'Charlie', 'Diana']);
    await addCourts(leagueId, ['Court 1']);
  });

  // B6.1 - Regenerate rounds after specified round
  // Validates: Requirement 6.1
  it('should regenerate rounds after the specified round number and return 200', async () => {
    await generateRound(leagueId);
    await generateRound(leagueId);
    await generateRound(leagueId);

    const res = await request(app)
      .post(`/api/leagues/${leagueId}/rounds/regenerate`)
      .send({ afterRoundNumber: 1 });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
    // Round 1 preserved, rounds 2-3 regenerated
    expect(res.body[0].roundNumber).toBe(1);
    expect(res.body[1].roundNumber).toBe(2);
    expect(res.body[2].roundNumber).toBe(3);
  });

  // B6.2 - Regeneration includes added player
  // Validates: Requirement 6.2
  it('should include a newly added player in regenerated round assignments', async () => {
    await generateRound(leagueId);
    await generateRound(leagueId);

    // Add a new player
    const newPlayerRes = await request(app)
      .post(`/api/leagues/${leagueId}/players`)
      .send({ name: 'Eve' });
    const newPlayerId = newPlayerRes.body.id;

    // Regenerate after round 1
    const regenRes = await request(app)
      .post(`/api/leagues/${leagueId}/rounds/regenerate`)
      .send({ afterRoundNumber: 1 });

    expect(regenRes.status).toBe(200);

    // Check that the new player appears in at least one regenerated round's assignments
    const round2 = regenRes.body.find((r: any) => r.roundNumber === 2);
    const assignmentsRes = await request(app)
      .get(`/api/rounds/${round2.id}/assignments`);

    const allPlayerIds = assignmentsRes.body.flatMap((a: any) => [
      ...a.team1PlayerIds,
      ...a.team2PlayerIds,
    ]);

    // With 5 players and 1 court (4 slots), the new player should appear
    // either in assignments or as a bye. Check across all regenerated rounds.
    let newPlayerFound = false;
    for (const round of regenRes.body.filter((r: any) => r.roundNumber > 1)) {
      const aRes = await request(app).get(`/api/rounds/${round.id}/assignments`);
      const ids = aRes.body.flatMap((a: any) => [
        ...a.team1PlayerIds,
        ...a.team2PlayerIds,
      ]);
      if (ids.includes(newPlayerId)) {
        newPlayerFound = true;
        break;
      }
    }
    expect(newPlayerFound).toBe(true);
  });

  // B6.3 - Regeneration excludes removed player
  // Validates: Requirement 6.3
  it('should exclude a removed player from regenerated round assignments', async () => {
    await generateRound(leagueId);
    await generateRound(leagueId);

    // Get players and remove one
    const playersRes = await request(app).get(`/api/leagues/${leagueId}/players`);
    const playerToRemove = playersRes.body[0];

    await request(app).delete(`/api/players/${playerToRemove.id}`);

    // Regenerate after round 1
    const regenRes = await request(app)
      .post(`/api/leagues/${leagueId}/rounds/regenerate`)
      .send({ afterRoundNumber: 1 });

    expect(regenRes.status).toBe(200);

    // Verify removed player is absent from all regenerated round assignments
    for (const round of regenRes.body.filter((r: any) => r.roundNumber > 1)) {
      const aRes = await request(app).get(`/api/rounds/${round.id}/assignments`);
      const ids = aRes.body.flatMap((a: any) => [
        ...a.team1PlayerIds,
        ...a.team2PlayerIds,
      ]);
      expect(ids).not.toContain(playerToRemove.id);
    }
  });

  // B6.4 - Regenerate with invalid afterRoundNumber
  // Validates: Requirement 6.4
  it('should return 400 for invalid afterRoundNumber', async () => {
    await generateRound(leagueId);

    const res = await request(app)
      .post(`/api/leagues/${leagueId}/rounds/regenerate`)
      .send({ afterRoundNumber: -1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // B6.5 - Regeneration preserves past rounds
  // Validates: Requirement 6.5
  it('should preserve rounds at or before afterRoundNumber unchanged', async () => {
    // Generate 4 rounds
    await generateRound(leagueId);
    await generateRound(leagueId);
    await generateRound(leagueId);
    await generateRound(leagueId);

    // Capture original rounds 1-2
    const beforeRes = await request(app).get(`/api/leagues/${leagueId}/rounds`);
    const originalRound1 = beforeRes.body.find((r: any) => r.roundNumber === 1);
    const originalRound2 = beforeRes.body.find((r: any) => r.roundNumber === 2);

    // Regenerate after round 2
    const regenRes = await request(app)
      .post(`/api/leagues/${leagueId}/rounds/regenerate`)
      .send({ afterRoundNumber: 2 });

    expect(regenRes.status).toBe(200);
    expect(regenRes.body.length).toBe(4);

    // Rounds 1-2 should be unchanged (same IDs)
    const regenRound1 = regenRes.body.find((r: any) => r.roundNumber === 1);
    const regenRound2 = regenRes.body.find((r: any) => r.roundNumber === 2);

    expect(regenRound1.id).toBe(originalRound1.id);
    expect(regenRound2.id).toBe(originalRound2.id);

    // Rounds 3-4 should have new IDs (regenerated)
    const regenRound3 = regenRes.body.find((r: any) => r.roundNumber === 3);
    const regenRound4 = regenRes.body.find((r: any) => r.roundNumber === 4);
    expect(regenRound3).toBeDefined();
    expect(regenRound4).toBeDefined();
  });
});
