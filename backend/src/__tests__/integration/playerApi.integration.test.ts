import { app, request, resetState, createLeague, addPlayers } from './helpers';

describe('Player Management API Integration Tests', () => {
  let leagueId: string;

  beforeEach(async () => {
    resetState();
    const res = await createLeague('Test League');
    leagueId = res.body.id;
  });

  // B2.1 - Add player with valid name
  // Validates: Requirement 2.1
  it('should add a player with valid name and return 201', async () => {
    const res = await request(app)
      .post(`/api/leagues/${leagueId}/players`)
      .send({ name: 'Alice' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      leagueId,
      name: 'Alice',
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
  });

  // B2.2 - List players for league
  // Validates: Requirement 2.2
  it('should list all players for a league and return 200', async () => {
    await addPlayers(leagueId, ['Alice', 'Bob', 'Charlie']);

    const res = await request(app).get(`/api/leagues/${leagueId}/players`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
    const names = res.body.map((p: any) => p.name);
    expect(names).toContain('Alice');
    expect(names).toContain('Bob');
    expect(names).toContain('Charlie');
  });

  // B2.3 - Delete player by valid ID
  // Validates: Requirement 2.3
  it('should delete a player and remove them from subsequent GET', async () => {
    const [alice] = await addPlayers(leagueId, ['Alice', 'Bob']);

    const deleteRes = await request(app).delete(`/api/players/${alice.id}`);
    expect(deleteRes.status).toBe(200);

    const listRes = await request(app).get(`/api/leagues/${leagueId}/players`);
    expect(listRes.body.length).toBe(1);
    const ids = listRes.body.map((p: any) => p.id);
    expect(ids).not.toContain(alice.id);
  });

  // B2.4 - Delete player by non-existent ID
  // Validates: Requirement 2.4
  it('should return 404 when deleting a non-existent player', async () => {
    const res = await request(app).delete('/api/players/non-existent-id');

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  // B2.5 - Add player with empty name
  // Validates: Requirement 2.5
  it('should return 400 when adding a player with empty name', async () => {
    const res = await request(app)
      .post(`/api/leagues/${leagueId}/players`)
      .send({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // B2.6 - Add player with missing name
  // Validates: Requirement 2.6
  it('should return 400 when adding a player with missing name', async () => {
    const res = await request(app)
      .post(`/api/leagues/${leagueId}/players`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // B2.7 - Players isolated between leagues
  // Validates: Requirement 2.7
  it('should return only players belonging to the requested league', async () => {
    const league2Res = await createLeague('League 2');
    const league2Id = league2Res.body.id;

    await addPlayers(leagueId, ['Alice', 'Bob']);
    await addPlayers(league2Id, ['Charlie', 'Diana']);

    const res1 = await request(app).get(`/api/leagues/${leagueId}/players`);
    expect(res1.status).toBe(200);
    expect(res1.body.length).toBe(2);
    const names1 = res1.body.map((p: any) => p.name);
    expect(names1).toContain('Alice');
    expect(names1).toContain('Bob');
    expect(names1).not.toContain('Charlie');
    expect(names1).not.toContain('Diana');

    const res2 = await request(app).get(`/api/leagues/${league2Id}/players`);
    expect(res2.status).toBe(200);
    expect(res2.body.length).toBe(2);
    const names2 = res2.body.map((p: any) => p.name);
    expect(names2).toContain('Charlie');
    expect(names2).toContain('Diana');
    expect(names2).not.toContain('Alice');
    expect(names2).not.toContain('Bob');
  });
});
