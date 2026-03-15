import { app, request, resetState, createLeague, addCourts } from './helpers';

describe('Court Management API Integration Tests', () => {
  let leagueId: string;

  beforeEach(async () => {
    resetState();
    const res = await createLeague('Test League');
    leagueId = res.body.id;
  });

  // B3.1 - Add court with valid identifier
  // Validates: Requirement 3.1
  it('should add a court with valid identifier and return 201', async () => {
    const res = await request(app)
      .post(`/api/leagues/${leagueId}/courts`)
      .send({ identifier: 'Court 1' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      leagueId,
      identifier: 'Court 1',
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
  });

  // B3.2 - List courts for league
  // Validates: Requirement 3.2
  it('should list all courts for a league and return 200', async () => {
    await addCourts(leagueId, ['Court 1', 'Court 2', 'Court 3']);

    const res = await request(app).get(`/api/leagues/${leagueId}/courts`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
    const identifiers = res.body.map((c: any) => c.identifier);
    expect(identifiers).toContain('Court 1');
    expect(identifiers).toContain('Court 2');
    expect(identifiers).toContain('Court 3');
  });

  // B3.3 - Delete court by valid ID
  // Validates: Requirement 3.3
  it('should delete a court and remove it from subsequent GET', async () => {
    const [court1] = await addCourts(leagueId, ['Court 1', 'Court 2']);

    const deleteRes = await request(app).delete(`/api/courts/${court1.id}`);
    expect(deleteRes.status).toBe(200);

    const listRes = await request(app).get(`/api/leagues/${leagueId}/courts`);
    expect(listRes.body.length).toBe(1);
    const ids = listRes.body.map((c: any) => c.id);
    expect(ids).not.toContain(court1.id);
  });

  // B3.4 - Delete court by non-existent ID
  // Validates: Requirement 3.4
  it('should return 404 when deleting a non-existent court', async () => {
    const res = await request(app).delete('/api/courts/non-existent-id');

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  // B3.5 - Add court with missing identifier
  // Validates: Requirement 3.5
  it('should return 400 when adding a court with missing identifier', async () => {
    const res = await request(app)
      .post(`/api/leagues/${leagueId}/courts`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
