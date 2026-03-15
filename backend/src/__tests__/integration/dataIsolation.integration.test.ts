import { app, request, resetState, createLeague, addPlayers, addCourts, generateRound } from './helpers';

describe('Data Isolation Integration Tests', () => {
  let leagueA: any;
  let leagueB: any;

  beforeEach(async () => {
    resetState();

    // Create two separate leagues
    const resA = await createLeague('League A');
    const resB = await createLeague('League B');
    leagueA = resA.body;
    leagueB = resB.body;
  });

  // B13.1: Players isolated between leagues
  // Validates: Requirement 12.1
  it('should return only players belonging to the requested league', async () => {
    await addPlayers(leagueA.id, ['Alice', 'Bob']);
    await addPlayers(leagueB.id, ['Charlie', 'Diana']);

    const resA = await request(app).get(`/api/leagues/${leagueA.id}/players`);
    const resB = await request(app).get(`/api/leagues/${leagueB.id}/players`);

    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);

    expect(resA.body).toHaveLength(2);
    expect(resA.body.map((p: any) => p.name).sort()).toEqual(['Alice', 'Bob']);

    expect(resB.body).toHaveLength(2);
    expect(resB.body.map((p: any) => p.name).sort()).toEqual(['Charlie', 'Diana']);
  });

  // B13.2: Courts isolated between leagues
  // Validates: Requirement 12.2
  it('should return only courts belonging to the requested league', async () => {
    await addCourts(leagueA.id, ['Court A1', 'Court A2']);
    await addCourts(leagueB.id, ['Court B1']);

    const resA = await request(app).get(`/api/leagues/${leagueA.id}/courts`);
    const resB = await request(app).get(`/api/leagues/${leagueB.id}/courts`);

    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);

    expect(resA.body).toHaveLength(2);
    expect(resA.body.map((c: any) => c.identifier).sort()).toEqual(['Court A1', 'Court A2']);

    expect(resB.body).toHaveLength(1);
    expect(resB.body[0].identifier).toBe('Court B1');
  });

  // B13.3: Rounds isolated between leagues
  // Validates: Requirement 12.3
  it('should return only rounds belonging to the requested league', async () => {
    // Set up league A with players, courts, and rounds
    await addPlayers(leagueA.id, ['Alice', 'Bob', 'Charlie', 'Diana']);
    await addCourts(leagueA.id, ['Court A1']);
    await generateRound(leagueA.id);
    await generateRound(leagueA.id);

    // Set up league B with players, courts, and one round
    await addPlayers(leagueB.id, ['Eve', 'Frank', 'Grace', 'Hank']);
    await addCourts(leagueB.id, ['Court B1']);
    await generateRound(leagueB.id);

    const resA = await request(app).get(`/api/leagues/${leagueA.id}/rounds`);
    const resB = await request(app).get(`/api/leagues/${leagueB.id}/rounds`);

    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);

    expect(resA.body).toHaveLength(2);
    expect(resA.body.every((r: any) => r.leagueId === leagueA.id)).toBe(true);

    expect(resB.body).toHaveLength(1);
    expect(resB.body[0].leagueId).toBe(leagueB.id);
  });

  // B13.4: Delete player doesn't affect other league
  // Validates: Requirement 12.4
  it('should not affect players in another league when deleting a player', async () => {
    const playersA = await addPlayers(leagueA.id, ['Alice', 'Bob']);
    const playersB = await addPlayers(leagueB.id, ['Charlie', 'Diana']);

    // Delete a player from league A
    const deleteRes = await request(app).delete(`/api/players/${playersA[0].id}`);
    expect(deleteRes.status).toBe(200);

    // League A should have one fewer player
    const resA = await request(app).get(`/api/leagues/${leagueA.id}/players`);
    expect(resA.status).toBe(200);
    expect(resA.body).toHaveLength(1);
    expect(resA.body[0].name).toBe('Bob');

    // League B should be completely unaffected
    const resB = await request(app).get(`/api/leagues/${leagueB.id}/players`);
    expect(resB.status).toBe(200);
    expect(resB.body).toHaveLength(2);
    expect(resB.body.map((p: any) => p.name).sort()).toEqual(['Charlie', 'Diana']);
  });
});
