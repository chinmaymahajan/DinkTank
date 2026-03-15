import { app, request, resetState, createLeague, addPlayers, addCourts, generateRound } from './helpers';

describe('Complete Session Flow API Integration Tests', () => {
  beforeEach(() => {
    resetState();
  });

  // B7.1 - Full session: create → add → generate → view → update
  // Validates: Requirement 7.1
  it('should maintain data consistency across a full session workflow', async () => {
    // Step 1: Create league
    const leagueRes = await createLeague('Session League');
    expect(leagueRes.status).toBe(201);
    const leagueId = leagueRes.body.id;

    // Step 2: Add players
    const players = await addPlayers(leagueId, ['Alice', 'Bob', 'Charlie', 'Diana']);
    expect(players).toHaveLength(4);

    // Step 3: Add courts
    const courts = await addCourts(leagueId, ['Court 1']);
    expect(courts).toHaveLength(1);

    // Step 4: Generate multiple rounds
    const round1Res = await generateRound(leagueId);
    expect(round1Res.status).toBe(201);
    const round2Res = await generateRound(leagueId);
    expect(round2Res.status).toBe(201);

    // Step 5: View assignments for round 1
    const assignRes = await request(app).get(`/api/rounds/${round1Res.body.id}/assignments`);
    expect(assignRes.status).toBe(200);
    expect(Array.isArray(assignRes.body)).toBe(true);
    expect(assignRes.body.length).toBeGreaterThan(0);

    const originalAssignment = assignRes.body[0];

    // Step 6: Update assignments (swap teams)
    const updatedAssignments = [{
      courtId: originalAssignment.courtId,
      team1PlayerIds: originalAssignment.team2PlayerIds,
      team2PlayerIds: originalAssignment.team1PlayerIds,
    }];

    const putRes = await request(app)
      .put(`/api/rounds/${round1Res.body.id}/assignments`)
      .send({ assignments: updatedAssignments });
    expect(putRes.status).toBe(200);

    // Verify the update persisted
    const verifyRes = await request(app).get(`/api/rounds/${round1Res.body.id}/assignments`);
    const updatedAssignment = verifyRes.body.find(
      (a: any) => a.courtId === originalAssignment.courtId
    );
    expect(updatedAssignment.team1PlayerIds).toEqual(originalAssignment.team2PlayerIds);
    expect(updatedAssignment.team2PlayerIds).toEqual(originalAssignment.team1PlayerIds);

    // Verify round 2 is still intact
    const round2AssignRes = await request(app).get(`/api/rounds/${round2Res.body.id}/assignments`);
    expect(round2AssignRes.status).toBe(200);
    expect(round2AssignRes.body.length).toBeGreaterThan(0);
  });

  // B7.2 - Player appears in exactly one court per round
  // Validates: Requirement 7.2
  it('should assign each player to at most one court per round', async () => {
    const leagueRes = await createLeague('Uniqueness League');
    const leagueId = leagueRes.body.id;
    await addPlayers(leagueId, ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Hank']);
    await addCourts(leagueId, ['Court 1', 'Court 2']);

    const roundRes = await generateRound(leagueId);
    const assignRes = await request(app).get(`/api/rounds/${roundRes.body.id}/assignments`);

    expect(assignRes.status).toBe(200);

    // Collect all assigned player IDs across all courts
    const allAssignedIds: string[] = [];
    for (const assignment of assignRes.body) {
      allAssignedIds.push(...assignment.team1PlayerIds, ...assignment.team2PlayerIds);
    }

    // Each player should appear at most once
    const uniqueIds = new Set(allAssignedIds);
    expect(uniqueIds.size).toBe(allAssignedIds.length);
  });

  // B7.3 - Deleted player excluded from new rounds
  // Validates: Requirement 7.3
  it('should exclude a deleted player from newly generated rounds', async () => {
    const leagueRes = await createLeague('Delete Flow League');
    const leagueId = leagueRes.body.id;
    const players = await addPlayers(leagueId, ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']);
    await addCourts(leagueId, ['Court 1']);

    // Generate a round with all players
    await generateRound(leagueId);

    // Delete a player
    const deletedPlayer = players[0];
    const deleteRes = await request(app).delete(`/api/players/${deletedPlayer.id}`);
    expect(deleteRes.status).toBe(200);

    // Generate a new round after deletion
    const newRoundRes = await generateRound(leagueId);
    expect(newRoundRes.status).toBe(201);

    // Verify deleted player is not in the new round's assignments
    const assignRes = await request(app).get(`/api/rounds/${newRoundRes.body.id}/assignments`);
    const allAssignedIds: string[] = [];
    for (const assignment of assignRes.body) {
      allAssignedIds.push(...assignment.team1PlayerIds, ...assignment.team2PlayerIds);
    }

    expect(allAssignedIds).not.toContain(deletedPlayer.id);
  });

  // B7.4 - Dev seed creates usable data
  // Validates: Requirement 7.4
  it('should create usable data via dev seed and allow round generation', async () => {
    const seedRes = await request(app).post('/api/dev/seed');
    expect(seedRes.status).toBe(200);
    expect(seedRes.body.data).toBeDefined();
    expect(seedRes.body.data.league).toBeDefined();
    expect(seedRes.body.data.players).toBeGreaterThan(0);
    expect(seedRes.body.data.courts).toBeGreaterThan(0);

    const leagueId = seedRes.body.data.league.id;

    // Verify players and courts exist
    const playersRes = await request(app).get(`/api/leagues/${leagueId}/players`);
    expect(playersRes.status).toBe(200);
    expect(playersRes.body.length).toBeGreaterThan(0);

    const courtsRes = await request(app).get(`/api/leagues/${leagueId}/courts`);
    expect(courtsRes.status).toBe(200);
    expect(courtsRes.body.length).toBeGreaterThan(0);

    // Round generation should succeed
    const roundRes = await generateRound(leagueId);
    expect(roundRes.status).toBe(201);
    expect(roundRes.body.roundNumber).toBe(1);
  });

  // B7.5 - Dev clear removes all data
  // Validates: Requirement 7.5
  it('should remove all data via dev clear', async () => {
    // Seed some data first
    await request(app).post('/api/dev/seed');

    // Verify data exists
    const beforeRes = await request(app).get('/api/leagues');
    expect(beforeRes.body.length).toBeGreaterThan(0);

    // Clear all data
    const clearRes = await request(app).post('/api/dev/clear');
    expect(clearRes.status).toBe(200);
    expect(clearRes.body.message).toBeDefined();

    // Verify leagues are empty
    const afterRes = await request(app).get('/api/leagues');
    expect(afterRes.status).toBe(200);
    expect(afterRes.body).toEqual([]);
  });
});
