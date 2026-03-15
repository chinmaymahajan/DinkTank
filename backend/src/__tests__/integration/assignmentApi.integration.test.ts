import { app, request, resetState, createLeague, addPlayers, addCourts, generateRound } from './helpers';

describe('Assignment & Bye Count API Integration Tests', () => {
  let leagueId: string;

  beforeEach(async () => {
    resetState();
    const res = await createLeague('Test League');
    leagueId = res.body.id;
  });

  // B5.1 - Get assignments for generated round
  // Validates: Requirement 5.1
  it('should return 200 with assignments for a generated round', async () => {
    await addPlayers(leagueId, ['Alice', 'Bob', 'Charlie', 'Diana']);
    await addCourts(leagueId, ['Court 1']);
    const roundRes = await generateRound(leagueId);
    const roundId = roundRes.body.id;

    const res = await request(app).get(`/api/rounds/${roundId}/assignments`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    // Each assignment should have players on courts
    for (const assignment of res.body) {
      expect(assignment.team1PlayerIds.length).toBeGreaterThan(0);
      expect(assignment.team2PlayerIds.length).toBeGreaterThan(0);
    }
  });

  // B5.2 - Assignment structure validation
  // Validates: Requirement 5.2
  it('should return assignments with courtId, team1PlayerIds[], and team2PlayerIds[]', async () => {
    await addPlayers(leagueId, ['Alice', 'Bob', 'Charlie', 'Diana']);
    await addCourts(leagueId, ['Court 1']);
    const roundRes = await generateRound(leagueId);
    const roundId = roundRes.body.id;

    const res = await request(app).get(`/api/rounds/${roundId}/assignments`);

    expect(res.status).toBe(200);
    for (const assignment of res.body) {
      expect(assignment).toHaveProperty('courtId');
      expect(assignment).toHaveProperty('team1PlayerIds');
      expect(assignment).toHaveProperty('team2PlayerIds');
      expect(Array.isArray(assignment.team1PlayerIds)).toBe(true);
      expect(Array.isArray(assignment.team2PlayerIds)).toBe(true);
      // 2v2 pickleball: each team has 2 players
      expect(assignment.team1PlayerIds.length).toBe(2);
      expect(assignment.team2PlayerIds.length).toBe(2);
    }
  });

  // B5.3 - Bye counts with excess players
  // Validates: Requirement 5.3
  it('should reflect bye counts for unassigned players with excess players', async () => {
    // 5 players, 1 court (capacity 4) => 1 player on bye
    const players = await addPlayers(leagueId, ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']);
    await addCourts(leagueId, ['Court 1']);
    await generateRound(leagueId);

    const res = await request(app).get(`/api/leagues/${leagueId}/bye-counts`);

    expect(res.status).toBe(200);
    // bye-counts returns a Record<playerId, number>
    const byeCounts: Record<string, number> = res.body;
    const playerIds = players.map((p: any) => p.id);

    // All players should be in the bye counts
    for (const pid of playerIds) {
      expect(byeCounts).toHaveProperty(pid);
    }

    // Total byes should equal players - court capacity = 5 - 4 = 1
    const totalByes = Object.values(byeCounts).reduce((sum, c) => sum + c, 0);
    expect(totalByes).toBe(1);
  });

  // B5.4 - Update assignments with valid data
  // Validates: Requirement 5.4
  it('should update assignments with valid data and return 200', async () => {
    const players = await addPlayers(leagueId, ['Alice', 'Bob', 'Charlie', 'Diana']);
    const courts = await addCourts(leagueId, ['Court 1']);
    const roundRes = await generateRound(leagueId);
    const roundId = roundRes.body.id;

    // Get current assignments
    const getRes = await request(app).get(`/api/rounds/${roundId}/assignments`);
    const originalAssignment = getRes.body[0];

    // Swap team1 and team2 players
    const updatedAssignments = [{
      courtId: originalAssignment.courtId,
      team1PlayerIds: originalAssignment.team2PlayerIds,
      team2PlayerIds: originalAssignment.team1PlayerIds,
    }];

    const putRes = await request(app)
      .put(`/api/rounds/${roundId}/assignments`)
      .send({ assignments: updatedAssignments });

    expect(putRes.status).toBe(200);
    expect(Array.isArray(putRes.body)).toBe(true);

    // Verify the swap took effect
    const updatedAssignment = putRes.body.find(
      (a: any) => a.courtId === originalAssignment.courtId
    );
    expect(updatedAssignment.team1PlayerIds).toEqual(originalAssignment.team2PlayerIds);
    expect(updatedAssignment.team2PlayerIds).toEqual(originalAssignment.team1PlayerIds);
  });

  // B5.5 - Update assignments with invalid data
  // Validates: Requirement 5.5
  it('should return 400 for invalid assignment update data', async () => {
    await addPlayers(leagueId, ['Alice', 'Bob', 'Charlie', 'Diana']);
    await addCourts(leagueId, ['Court 1']);
    const roundRes = await generateRound(leagueId);
    const roundId = roundRes.body.id;

    // Missing required fields - send without assignments array
    const res = await request(app)
      .put(`/api/rounds/${roundId}/assignments`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // B5.6 - Fair bye distribution across rounds
  // Validates: Requirement 5.6
  it('should distribute byes fairly across multiple rounds', async () => {
    // 5 players, 1 court => 1 bye per round, across 5 rounds each player should get ~1 bye
    await addPlayers(leagueId, ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']);
    await addCourts(leagueId, ['Court 1']);

    // Generate multiple rounds
    for (let i = 0; i < 5; i++) {
      await generateRound(leagueId);
    }

    const res = await request(app).get(`/api/leagues/${leagueId}/bye-counts`);
    expect(res.status).toBe(200);

    const byeCounts: Record<string, number> = res.body;
    const counts = Object.values(byeCounts);
    const maxBye = Math.max(...counts);
    const minBye = Math.min(...counts);

    // Fair distribution: max - min should be at most 1
    expect(maxBye - minBye).toBeLessThanOrEqual(1);
  });

  // B5.7 - No consecutive byes for same player
  // Validates: Requirement 5.7 (no explicit requirement number, but design spec B5.7)
  it('should not give any player consecutive byes across rounds', async () => {
    // 5 players, 1 court => 1 bye per round
    const players = await addPlayers(leagueId, ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']);
    await addCourts(leagueId, ['Court 1']);

    // Generate 5 rounds
    const rounds = [];
    for (let i = 0; i < 5; i++) {
      const roundRes = await generateRound(leagueId);
      rounds.push(roundRes.body);
    }

    const playerIds = players.map((p: any) => p.id);

    // For each round, determine who was on bye
    const byesByRound: Set<string>[] = [];
    for (const round of rounds) {
      const assignRes = await request(app).get(`/api/rounds/${round.id}/assignments`);
      const assignedPlayers = new Set<string>();
      for (const a of assignRes.body) {
        a.team1PlayerIds.forEach((id: string) => assignedPlayers.add(id));
        a.team2PlayerIds.forEach((id: string) => assignedPlayers.add(id));
      }
      const byePlayers = new Set(playerIds.filter((id: string) => !assignedPlayers.has(id)));
      byesByRound.push(byePlayers);
    }

    // Check no player has consecutive byes
    for (const pid of playerIds) {
      for (let i = 0; i < byesByRound.length - 1; i++) {
        const byeThisRound = byesByRound[i].has(pid);
        const byeNextRound = byesByRound[i + 1].has(pid);
        expect(byeThisRound && byeNextRound).toBe(false);
      }
    }
  });

  // B5.8 - Bye count accuracy per round
  // Validates: Requirement 5.8 (bye count increments correctly per round)
  it('should increment bye counts by exactly 1 per bye round per player', async () => {
    // 5 players, 1 court => 1 bye per round
    const players = await addPlayers(leagueId, ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']);
    await addCourts(leagueId, ['Court 1']);
    const playerIds = players.map((p: any) => p.id);

    // Track bye counts after each round
    for (let roundNum = 1; roundNum <= 3; roundNum++) {
      // Get bye counts before generating
      const beforeRes = await request(app).get(`/api/leagues/${leagueId}/bye-counts`);
      const beforeCounts: Record<string, number> = beforeRes.body;

      // Generate a round
      const roundRes = await generateRound(leagueId);
      const roundId = roundRes.body.id;

      // Determine who was on bye in this round
      const assignRes = await request(app).get(`/api/rounds/${roundId}/assignments`);
      const assignedPlayers = new Set<string>();
      for (const a of assignRes.body) {
        a.team1PlayerIds.forEach((id: string) => assignedPlayers.add(id));
        a.team2PlayerIds.forEach((id: string) => assignedPlayers.add(id));
      }

      // Get bye counts after generating
      const afterRes = await request(app).get(`/api/leagues/${leagueId}/bye-counts`);
      const afterCounts: Record<string, number> = afterRes.body;

      // Verify: players on bye should have count incremented by 1, others unchanged
      for (const pid of playerIds) {
        const before = beforeCounts[pid] || 0;
        const after = afterCounts[pid] || 0;
        if (!assignedPlayers.has(pid)) {
          // Player was on bye - count should increment by 1
          expect(after).toBe(before + 1);
        } else {
          // Player was assigned - count should stay the same
          expect(after).toBe(before);
        }
      }
    }
  });
});
