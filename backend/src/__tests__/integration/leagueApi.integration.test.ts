import { app, request, resetState, createLeague } from './helpers';

describe('League Lifecycle API Integration Tests', () => {
  beforeEach(() => {
    resetState();
  });

  // B1.1 - Create league with valid data
  // Validates: Requirement 1.1
  it('should create a league with valid data and return 201', async () => {
    const res = await request(app)
      .post('/api/leagues')
      .send({ name: 'Summer League', format: 'round_robin' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: 'Summer League',
      format: 'round_robin',
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
    expect(res.body.updatedAt).toBeDefined();
  });

  // B1.2 - List all leagues
  // Validates: Requirement 1.2
  it('should list all leagues and return 200', async () => {
    await createLeague('League A');
    await createLeague('League B');

    const res = await request(app).get('/api/leagues');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    const names = res.body.map((l: any) => l.name);
    expect(names).toContain('League A');
    expect(names).toContain('League B');
  });

  // B1.3 - Get league by valid ID
  // Validates: Requirement 1.3
  it('should get a league by valid ID and return 200', async () => {
    const createRes = await createLeague('My League');
    const leagueId = createRes.body.id;

    const res = await request(app).get(`/api/leagues/${leagueId}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(leagueId);
    expect(res.body.name).toBe('My League');
    expect(res.body.format).toBe('round_robin');
  });

  // B1.4 - Get league by non-existent ID
  // Validates: Requirement 1.4
  it('should return 404 for a non-existent league ID', async () => {
    const res = await request(app).get('/api/leagues/non-existent-id');

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  // B1.5 - Select league with valid ID
  // Validates: Requirement 1.5
  it('should select a league with valid ID and return 200', async () => {
    const createRes = await createLeague('Selectable League');
    const leagueId = createRes.body.id;

    const res = await request(app).post(`/api/leagues/${leagueId}/select`);

    expect(res.status).toBe(200);
    expect(res.body.leagueId).toBe(leagueId);
  });

  // B1.6 - Select league with non-existent ID
  // Validates: Requirement 1.6
  it('should return 404 when selecting a non-existent league', async () => {
    const res = await request(app).post('/api/leagues/non-existent-id/select');

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  // B1.7 - Create league with invalid format
  // Validates: Requirement 1.7
  it('should return 400 for an invalid league format', async () => {
    const res = await request(app)
      .post('/api/leagues')
      .send({ name: 'Test', format: 'invalid' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // B1.8 - Create league with missing name
  // Validates: Requirement 1.8
  it('should return 400 when creating a league with missing name', async () => {
    const res = await request(app)
      .post('/api/leagues')
      .send({ format: 'round_robin' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
