import { app, request, resetState } from './helpers';
import fc from 'fast-check';

// Arbitrary: random alphanumeric league name (1-50 chars)
const leagueNameArb = fc.stringMatching(/^[a-zA-Z0-9]{1,50}$/);

// Arbitrary: random alphanumeric player name (1-30 chars)
const playerNameArb = fc.stringMatching(/^[a-zA-Z0-9]{1,30}$/);

// Arbitrary: random alphanumeric court identifier (1-30 chars)
const courtIdentifierArb = fc.stringMatching(/^[a-zA-Z0-9]{1,30}$/);

// The only valid format currently
const leagueFormatArb = fc.constant('round_robin' as const);

describe('Property-Based Integration Tests', () => {
  let server: any;

  beforeAll((done) => {
    server = app.listen(0, () => done());
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    resetState();
  });

  // Feature: e2e-integration-tests, Property 1: League create-then-retrieve round trip
  // **Validates: Requirements 1.1, 1.2, 1.3, 1.5**
  describe('Property 1: League create-then-retrieve round trip', () => {
    it('creating a league and retrieving it by ID should return the same name and format, and listing should include it', async () => {
      await fc.assert(
        fc.asyncProperty(leagueNameArb, leagueFormatArb, async (name, format) => {
          resetState();
          const createRes = await request(server).post('/api/leagues').send({ name, format });
          expect(createRes.status).toBe(201);
          expect(createRes.body.id).toBeDefined();
          expect(createRes.body.name).toBe(name);
          expect(createRes.body.format).toBe(format);

          const leagueId = createRes.body.id;

          const getRes = await request(server).get(`/api/leagues/${leagueId}`);
          expect(getRes.status).toBe(200);
          expect(getRes.body.id).toBe(leagueId);
          expect(getRes.body.name).toBe(name);
          expect(getRes.body.format).toBe(format);

          const listRes = await request(server).get('/api/leagues');
          expect(listRes.status).toBe(200);
          expect(Array.isArray(listRes.body)).toBe(true);
          const found = listRes.body.find((l: any) => l.id === leagueId);
          expect(found).toBeDefined();
          expect(found.name).toBe(name);
          expect(found.format).toBe(format);
        }),
        { numRuns: 100 }
      );
    }, 60000);
  });

  // Feature: e2e-integration-tests, Property 2: Player add-then-list round trip
  // **Validates: Requirements 2.1, 2.2**
  describe('Property 2: Player add-then-list round trip', () => {
    it('adding a player to a league and listing players should include that player with correct fields', async () => {
      await fc.assert(
        fc.asyncProperty(leagueNameArb, playerNameArb, async (leagueName, playerName) => {
          resetState();
          const leagueRes = await request(server).post('/api/leagues').send({ name: leagueName, format: 'round_robin' });
          expect(leagueRes.status).toBe(201);
          const leagueId = leagueRes.body.id;

          const addRes = await request(server).post(`/api/leagues/${leagueId}/players`).send({ name: playerName });
          expect(addRes.status).toBe(201);
          expect(addRes.body.id).toBeDefined();
          expect(addRes.body.leagueId).toBe(leagueId);
          expect(addRes.body.name).toBe(playerName);
          expect(addRes.body.createdAt).toBeDefined();

          const listRes = await request(server).get(`/api/leagues/${leagueId}/players`);
          expect(listRes.status).toBe(200);
          expect(Array.isArray(listRes.body)).toBe(true);
          const found = listRes.body.find((p: any) => p.id === addRes.body.id);
          expect(found).toBeDefined();
          expect(found.name).toBe(playerName);
          expect(found.leagueId).toBe(leagueId);
        }),
        { numRuns: 100 }
      );
    }, 60000);
  });

  // Feature: e2e-integration-tests, Property 3: Player delete removes from list
  // **Validates: Requirements 2.3**
  describe('Property 3: Player delete removes from list', () => {
    it('deleting a player should remove it from the list and decrease count by exactly one', async () => {
      await fc.assert(
        fc.asyncProperty(
          leagueNameArb,
          fc.array(playerNameArb, { minLength: 1, maxLength: 3 }),
          async (leagueName, playerNames) => {
            resetState();
            const leagueRes = await request(server).post('/api/leagues').send({ name: leagueName, format: 'round_robin' });
            expect(leagueRes.status).toBe(201);
            const leagueId = leagueRes.body.id;

            const addedPlayers = [];
            for (const name of playerNames) {
              const addRes = await request(server).post(`/api/leagues/${leagueId}/players`).send({ name });
              expect(addRes.status).toBe(201);
              addedPlayers.push(addRes.body);
            }

            const beforeRes = await request(server).get(`/api/leagues/${leagueId}/players`);
            expect(beforeRes.status).toBe(200);
            const countBefore = beforeRes.body.length;

            const playerToDelete = addedPlayers[0];
            const deleteRes = await request(server).delete(`/api/players/${playerToDelete.id}`);
            expect(deleteRes.status).toBe(200);

            const afterRes = await request(server).get(`/api/leagues/${leagueId}/players`);
            expect(afterRes.status).toBe(200);
            const found = afterRes.body.find((p: any) => p.id === playerToDelete.id);
            expect(found).toBeUndefined();
            expect(afterRes.body.length).toBe(countBefore - 1);
          }
        ),
        { numRuns: 100 }
      );
    }, 60000);
  });

  // Feature: e2e-integration-tests, Property 4: Court add-then-list round trip
  // **Validates: Requirements 3.1, 3.2**
  describe('Property 4: Court add-then-list round trip', () => {
    it('adding a court to a league and listing courts should include that court with correct fields', async () => {
      await fc.assert(
        fc.asyncProperty(leagueNameArb, courtIdentifierArb, async (leagueName, courtIdentifier) => {
          resetState();
          const leagueRes = await request(server).post('/api/leagues').send({ name: leagueName, format: 'round_robin' });
          expect(leagueRes.status).toBe(201);
          const leagueId = leagueRes.body.id;

          const addRes = await request(server).post(`/api/leagues/${leagueId}/courts`).send({ identifier: courtIdentifier });
          expect(addRes.status).toBe(201);
          expect(addRes.body.id).toBeDefined();
          expect(addRes.body.leagueId).toBe(leagueId);
          expect(addRes.body.identifier).toBe(courtIdentifier);
          expect(addRes.body.createdAt).toBeDefined();

          const listRes = await request(server).get(`/api/leagues/${leagueId}/courts`);
          expect(listRes.status).toBe(200);
          expect(Array.isArray(listRes.body)).toBe(true);
          const found = listRes.body.find((c: any) => c.id === addRes.body.id);
          expect(found).toBeDefined();
          expect(found.identifier).toBe(courtIdentifier);
          expect(found.leagueId).toBe(leagueId);
        }),
        { numRuns: 100 }
      );
    }, 60000);
  });

  // Feature: e2e-integration-tests, Property 5: Court delete removes from list
  // **Validates: Requirements 3.3**
  describe('Property 5: Court delete removes from list', () => {
    it('deleting a court should remove it from the list and decrease count by exactly one', async () => {
      await fc.assert(
        fc.asyncProperty(
          leagueNameArb,
          fc.array(courtIdentifierArb, { minLength: 1, maxLength: 3 }),
          async (leagueName, courtIdentifiers) => {
            resetState();
            const leagueRes = await request(server).post('/api/leagues').send({ name: leagueName, format: 'round_robin' });
            expect(leagueRes.status).toBe(201);
            const leagueId = leagueRes.body.id;

            const addedCourts = [];
            for (const identifier of courtIdentifiers) {
              const addRes = await request(server).post(`/api/leagues/${leagueId}/courts`).send({ identifier });
              expect(addRes.status).toBe(201);
              addedCourts.push(addRes.body);
            }

            const beforeRes = await request(server).get(`/api/leagues/${leagueId}/courts`);
            expect(beforeRes.status).toBe(200);
            const countBefore = beforeRes.body.length;

            const courtToDelete = addedCourts[0];
            const deleteRes = await request(server).delete(`/api/courts/${courtToDelete.id}`);
            expect(deleteRes.status).toBe(200);

            const afterRes = await request(server).get(`/api/leagues/${leagueId}/courts`);
            expect(afterRes.status).toBe(200);
            const found = afterRes.body.find((c: any) => c.id === courtToDelete.id);
            expect(found).toBeUndefined();
            expect(afterRes.body.length).toBe(countBefore - 1);
          }
        ),
        { numRuns: 100 }
      );
    }, 60000);
  });

  // Feature: e2e-integration-tests, Property 6: Round generation produces valid incrementing rounds
  // **Validates: Requirements 4.1, 4.2, 4.10**
  describe('Property 6: Round generation produces valid incrementing rounds', () => {
    it('generating N rounds should produce rounds with roundNumber 1 through N, listed in ascending order', async () => {
      await fc.assert(
        fc.asyncProperty(leagueNameArb, fc.integer({ min: 1, max: 5 }), async (leagueName, n) => {
          resetState();
          const leagueRes = await request(server).post('/api/leagues').send({ name: leagueName, format: 'round_robin' });
          expect(leagueRes.status).toBe(201);
          const leagueId = leagueRes.body.id;

          for (const name of ['PlayerA', 'PlayerB', 'PlayerC', 'PlayerD']) {
            const r = await request(server).post(`/api/leagues/${leagueId}/players`).send({ name });
            expect(r.status).toBe(201);
          }
          const courtRes = await request(server).post(`/api/leagues/${leagueId}/courts`).send({ identifier: 'Court1' });
          expect(courtRes.status).toBe(201);

          const generatedRounds = [];
          for (let i = 0; i < n; i++) {
            const roundRes = await request(server).post(`/api/leagues/${leagueId}/rounds`);
            expect(roundRes.status).toBe(201);
            generatedRounds.push(roundRes.body);
          }

          for (let i = 0; i < n; i++) {
            expect(generatedRounds[i].roundNumber).toBe(i + 1);
          }

          const listRes = await request(server).get(`/api/leagues/${leagueId}/rounds`);
          expect(listRes.status).toBe(200);
          expect(listRes.body.length).toBe(n);
          for (let i = 0; i < n; i++) {
            expect(listRes.body[i].roundNumber).toBe(i + 1);
          }
          for (let i = 1; i < listRes.body.length; i++) {
            expect(listRes.body[i].roundNumber).toBeGreaterThan(listRes.body[i - 1].roundNumber);
          }
        }),
        { numRuns: 100 }
      );
    }, 60000);
  });

  // Feature: e2e-integration-tests, Property 7: Round retrieval by number round trip
  // **Validates: Requirements 4.3**
  describe('Property 7: Round retrieval by number round trip', () => {
    it('retrieving a generated round by roundNumber should return the same id, leagueId, and roundNumber', async () => {
      await fc.assert(
        fc.asyncProperty(leagueNameArb, fc.integer({ min: 1, max: 5 }), async (leagueName, n) => {
          resetState();
          const leagueRes = await request(server).post('/api/leagues').send({ name: leagueName, format: 'round_robin' });
          expect(leagueRes.status).toBe(201);
          const leagueId = leagueRes.body.id;

          for (const name of ['PlayerA', 'PlayerB', 'PlayerC', 'PlayerD']) {
            const r = await request(server).post(`/api/leagues/${leagueId}/players`).send({ name });
            expect(r.status).toBe(201);
          }
          await request(server).post(`/api/leagues/${leagueId}/courts`).send({ identifier: 'Court1' });

          const generatedRounds = [];
          for (let i = 0; i < n; i++) {
            const roundRes = await request(server).post(`/api/leagues/${leagueId}/rounds`);
            expect(roundRes.status).toBe(201);
            generatedRounds.push(roundRes.body);
          }

          for (const round of generatedRounds) {
            const getRes = await request(server).get(`/api/leagues/${leagueId}/rounds/${round.roundNumber}`);
            expect(getRes.status).toBe(200);
            expect(getRes.body.id).toBe(round.id);
            expect(getRes.body.leagueId).toBe(round.leagueId);
            expect(getRes.body.roundNumber).toBe(round.roundNumber);
          }
        }),
        { numRuns: 100 }
      );
    }, 60000);
  });

  // Feature: e2e-integration-tests, Property 8: Current round is the latest generated
  // **Validates: Requirements 4.5**
  describe('Property 8: Current round is the latest generated', () => {
    it('the current round endpoint should return the round with the highest roundNumber', async () => {
      await fc.assert(
        fc.asyncProperty(leagueNameArb, fc.integer({ min: 1, max: 5 }), async (leagueName, n) => {
          resetState();
          const leagueRes = await request(server).post('/api/leagues').send({ name: leagueName, format: 'round_robin' });
          expect(leagueRes.status).toBe(201);
          const leagueId = leagueRes.body.id;

          for (const name of ['PlayerA', 'PlayerB', 'PlayerC', 'PlayerD']) {
            const r = await request(server).post(`/api/leagues/${leagueId}/players`).send({ name });
            expect(r.status).toBe(201);
          }
          await request(server).post(`/api/leagues/${leagueId}/courts`).send({ identifier: 'Court1' });

          let lastRound: any;
          for (let i = 0; i < n; i++) {
            const roundRes = await request(server).post(`/api/leagues/${leagueId}/rounds`);
            expect(roundRes.status).toBe(201);
            lastRound = roundRes.body;
          }

          const currentRes = await request(server).get(`/api/leagues/${leagueId}/rounds/current`);
          expect(currentRes.status).toBe(200);
          expect(currentRes.body.roundNumber).toBe(n);
          expect(currentRes.body.id).toBe(lastRound.id);
        }),
        { numRuns: 100 }
      );
    }, 60000);
  });

  // Feature: e2e-integration-tests, Property 9: Clear rounds empties the round list
  // **Validates: Requirements 4.9**
  describe('Property 9: Clear rounds empties the round list', () => {
    it('clearing rounds should result in an empty round list', async () => {
      await fc.assert(
        fc.asyncProperty(leagueNameArb, fc.integer({ min: 1, max: 5 }), async (leagueName, n) => {
          resetState();
          const leagueRes = await request(server).post('/api/leagues').send({ name: leagueName, format: 'round_robin' });
          expect(leagueRes.status).toBe(201);
          const leagueId = leagueRes.body.id;

          for (const name of ['PlayerA', 'PlayerB', 'PlayerC', 'PlayerD']) {
            const r = await request(server).post(`/api/leagues/${leagueId}/players`).send({ name });
            expect(r.status).toBe(201);
          }
          await request(server).post(`/api/leagues/${leagueId}/courts`).send({ identifier: 'Court1' });

          for (let i = 0; i < n; i++) {
            const roundRes = await request(server).post(`/api/leagues/${leagueId}/rounds`);
            expect(roundRes.status).toBe(201);
          }

          const deleteRes = await request(server).delete(`/api/leagues/${leagueId}/rounds`);
          expect(deleteRes.status).toBe(204);

          const afterRes = await request(server).get(`/api/leagues/${leagueId}/rounds`);
          expect(afterRes.status).toBe(200);
          expect(afterRes.body).toEqual([]);
        }),
        { numRuns: 100 }
      );
    }, 120000);
  });

  // Feature: e2e-integration-tests, Property 10: Generated assignments are structurally valid
  // **Validates: Requirements 5.1, 5.2**
  describe('Property 10: Generated assignments are structurally valid', () => {
    it('each assignment should have a valid courtId and two teams of exactly 2 player IDs referencing league players', async () => {
      await fc.assert(
        fc.asyncProperty(leagueNameArb, async (leagueName) => {
          resetState();
          const leagueRes = await request(server).post('/api/leagues').send({ name: leagueName, format: 'round_robin' });
          expect(leagueRes.status).toBe(201);
          const leagueId = leagueRes.body.id;

          const playerNames = ['P1', 'P2', 'P3', 'P4'];
          const players: any[] = [];
          for (const name of playerNames) {
            const r = await request(server).post(`/api/leagues/${leagueId}/players`).send({ name });
            expect(r.status).toBe(201);
            players.push(r.body);
          }
          const playerIds = new Set(players.map((p: any) => p.id));

          const courtRes = await request(server).post(`/api/leagues/${leagueId}/courts`).send({ identifier: 'Court1' });
          expect(courtRes.status).toBe(201);
          const courtId = courtRes.body.id;

          const roundRes = await request(server).post(`/api/leagues/${leagueId}/rounds`);
          expect(roundRes.status).toBe(201);
          const roundId = roundRes.body.id;

          const assignRes = await request(server).get(`/api/rounds/${roundId}/assignments`);
          expect(assignRes.status).toBe(200);
          expect(Array.isArray(assignRes.body)).toBe(true);
          expect(assignRes.body.length).toBeGreaterThan(0);

          for (const assignment of assignRes.body) {
            expect(assignment.courtId).toBe(courtId);
            expect(Array.isArray(assignment.team1PlayerIds)).toBe(true);
            expect(Array.isArray(assignment.team2PlayerIds)).toBe(true);
            expect(assignment.team1PlayerIds.length).toBe(2);
            expect(assignment.team2PlayerIds.length).toBe(2);
            for (const pid of [...assignment.team1PlayerIds, ...assignment.team2PlayerIds]) {
              expect(playerIds.has(pid)).toBe(true);
            }
          }
        }),
        { numRuns: 100 }
      );
    }, 60000);
  });

  // Feature: e2e-integration-tests, Property 11: Bye counts reflect unassigned players
  // **Validates: Requirements 5.3**
  describe('Property 11: Bye counts reflect unassigned players', () => {
    it('total byes per round should equal (playerCount - courts * 4) when players exceed capacity', async () => {
      await fc.assert(
        fc.asyncProperty(leagueNameArb, async (leagueName) => {
          resetState();
          const leagueRes = await request(server).post('/api/leagues').send({ name: leagueName, format: 'round_robin' });
          expect(leagueRes.status).toBe(201);
          const leagueId = leagueRes.body.id;

          const playerNames = ['P1', 'P2', 'P3', 'P4', 'P5'];
          for (const name of playerNames) {
            const r = await request(server).post(`/api/leagues/${leagueId}/players`).send({ name });
            expect(r.status).toBe(201);
          }
          await request(server).post(`/api/leagues/${leagueId}/courts`).send({ identifier: 'Court1' });

          const roundRes = await request(server).post(`/api/leagues/${leagueId}/rounds`);
          expect(roundRes.status).toBe(201);
          const roundId = roundRes.body.id;

          const assignRes = await request(server).get(`/api/rounds/${roundId}/assignments`);
          expect(assignRes.status).toBe(200);

          const assignedPlayerIds = new Set<string>();
          for (const a of assignRes.body) {
            for (const pid of [...a.team1PlayerIds, ...a.team2PlayerIds]) {
              assignedPlayerIds.add(pid);
            }
          }

          const byeCount = playerNames.length - assignedPlayerIds.size;
          const expectedByes = playerNames.length - 1 * 4;
          expect(byeCount).toBe(expectedByes);

          const byeRes = await request(server).get(`/api/leagues/${leagueId}/bye-counts`);
          expect(byeRes.status).toBe(200);
          const totalByes = Object.values(byeRes.body as Record<string, number>).reduce((sum: number, c: number) => sum + c, 0);
          expect(totalByes).toBe(expectedByes);
        }),
        { numRuns: 100 }
      );
    }, 60000);
  });

  // Feature: e2e-integration-tests, Property 12: Assignment update round trip
  // **Validates: Requirements 5.4**
  describe('Property 12: Assignment update round trip', () => {
    it('updating assignments with swapped players should be reflected when retrieved', async () => {
      await fc.assert(
        fc.asyncProperty(leagueNameArb, async (leagueName) => {
          resetState();
          const leagueRes = await request(server).post('/api/leagues').send({ name: leagueName, format: 'round_robin' });
          expect(leagueRes.status).toBe(201);
          const leagueId = leagueRes.body.id;

          const playerNames = ['P1', 'P2', 'P3', 'P4'];
          for (const name of playerNames) {
            const r = await request(server).post(`/api/leagues/${leagueId}/players`).send({ name });
            expect(r.status).toBe(201);
          }
          await request(server).post(`/api/leagues/${leagueId}/courts`).send({ identifier: 'Court1' });

          const roundRes = await request(server).post(`/api/leagues/${leagueId}/rounds`);
          expect(roundRes.status).toBe(201);
          const roundId = roundRes.body.id;

          const origRes = await request(server).get(`/api/rounds/${roundId}/assignments`);
          expect(origRes.status).toBe(200);
          expect(origRes.body.length).toBeGreaterThan(0);

          const orig = origRes.body[0];
          const newTeam1 = [orig.team1PlayerIds[0], orig.team2PlayerIds[0]];
          const newTeam2 = [orig.team1PlayerIds[1], orig.team2PlayerIds[1]];

          const putRes = await request(server).put(`/api/rounds/${roundId}/assignments`).send({
            assignments: [{ courtId: orig.courtId, team1PlayerIds: newTeam1, team2PlayerIds: newTeam2 }]
          });
          expect(putRes.status).toBe(200);

          const afterRes = await request(server).get(`/api/rounds/${roundId}/assignments`);
          expect(afterRes.status).toBe(200);
          const updated = afterRes.body.find((a: any) => a.courtId === orig.courtId);
          expect(updated).toBeDefined();
          expect(updated.team1PlayerIds.sort()).toEqual(newTeam1.sort());
          expect(updated.team2PlayerIds.sort()).toEqual(newTeam2.sort());
        }),
        { numRuns: 100 }
      );
    }, 60000);
  });

  // Feature: e2e-integration-tests, Property 13: Bye distribution fairness across rounds
  // **Validates: Requirements 5.6**
  describe('Property 13: Bye distribution fairness across rounds', () => {
    it('max bye count minus min bye count across all players should be at most 1', async () => {
      await fc.assert(
        fc.asyncProperty(leagueNameArb, fc.integer({ min: 3, max: 5 }), async (leagueName, numRounds) => {
          resetState();
          const leagueRes = await request(server).post('/api/leagues').send({ name: leagueName, format: 'round_robin' });
          expect(leagueRes.status).toBe(201);
          const leagueId = leagueRes.body.id;

          const playerNames = ['P1', 'P2', 'P3', 'P4', 'P5'];
          for (const name of playerNames) {
            const r = await request(server).post(`/api/leagues/${leagueId}/players`).send({ name });
            expect(r.status).toBe(201);
          }
          await request(server).post(`/api/leagues/${leagueId}/courts`).send({ identifier: 'Court1' });

          for (let i = 0; i < numRounds; i++) {
            const roundRes = await request(server).post(`/api/leagues/${leagueId}/rounds`);
            expect(roundRes.status).toBe(201);
          }

          const byeRes = await request(server).get(`/api/leagues/${leagueId}/bye-counts`);
          expect(byeRes.status).toBe(200);
          const counts = Object.values(byeRes.body as Record<string, number>);
          expect(counts.length).toBeGreaterThan(0);
          const maxBye = Math.max(...counts);
          const minBye = Math.min(...counts);
          expect(maxBye - minBye).toBeLessThanOrEqual(1);
        }),
        { numRuns: 50 }
      );
    }, 120000);
  });

  // Feature: e2e-integration-tests, Property 14: No consecutive byes for any player
  // **Validates: Requirements 5.7**
  describe('Property 14: No consecutive byes for any player', () => {
    it('no player should be on bye in two consecutive rounds', async () => {
      await fc.assert(
        fc.asyncProperty(leagueNameArb, fc.integer({ min: 3, max: 5 }), async (leagueName, numRounds) => {
          resetState();
          const leagueRes = await request(server).post('/api/leagues').send({ name: leagueName, format: 'round_robin' });
          expect(leagueRes.status).toBe(201);
          const leagueId = leagueRes.body.id;

          const playerNames = ['P1', 'P2', 'P3', 'P4', 'P5'];
          const players: any[] = [];
          for (const name of playerNames) {
            const r = await request(server).post(`/api/leagues/${leagueId}/players`).send({ name });
            expect(r.status).toBe(201);
            players.push(r.body);
          }
          const playerIds = players.map((p: any) => p.id);
          await request(server).post(`/api/leagues/${leagueId}/courts`).send({ identifier: 'Court1' });

          const roundIds: string[] = [];
          for (let i = 0; i < numRounds; i++) {
            const roundRes = await request(server).post(`/api/leagues/${leagueId}/rounds`);
            expect(roundRes.status).toBe(201);
            roundIds.push(roundRes.body.id);
          }

          const byesByRound: Set<string>[] = [];
          for (const roundId of roundIds) {
            const assignRes = await request(server).get(`/api/rounds/${roundId}/assignments`);
            expect(assignRes.status).toBe(200);
            const assignedInRound = new Set<string>();
            for (const a of assignRes.body) {
              for (const pid of [...a.team1PlayerIds, ...a.team2PlayerIds]) {
                assignedInRound.add(pid);
              }
            }
            const onBye = new Set<string>();
            for (const pid of playerIds) {
              if (!assignedInRound.has(pid)) onBye.add(pid);
            }
            byesByRound.push(onBye);
          }

          for (let i = 1; i < byesByRound.length; i++) {
            for (const pid of byesByRound[i]) {
              expect(byesByRound[i - 1].has(pid)).toBe(false);
            }
          }
        }),
        { numRuns: 50 }
      );
    }, 120000);
  });

  // Feature: e2e-integration-tests, Property 15: Bye count accuracy tracks per-round increments
  // **Validates: Requirements 5.8**
  describe('Property 15: Bye count accuracy tracks per-round increments', () => {
    it('bye count should increment by exactly 1 for players on bye and remain unchanged for assigned players', async () => {
      await fc.assert(
        fc.asyncProperty(leagueNameArb, fc.integer({ min: 2, max: 4 }), async (leagueName, numRounds) => {
          resetState();
          const leagueRes = await request(server).post('/api/leagues').send({ name: leagueName, format: 'round_robin' });
          expect(leagueRes.status).toBe(201);
          const leagueId = leagueRes.body.id;

          const playerNames = ['P1', 'P2', 'P3', 'P4', 'P5'];
          const players: any[] = [];
          for (const name of playerNames) {
            const r = await request(server).post(`/api/leagues/${leagueId}/players`).send({ name });
            expect(r.status).toBe(201);
            players.push(r.body);
          }
          const playerIds = players.map((p: any) => p.id);
          await request(server).post(`/api/leagues/${leagueId}/courts`).send({ identifier: 'Court1' });

          let prevByeCounts: Record<string, number> = {};
          for (const pid of playerIds) { prevByeCounts[pid] = 0; }

          for (let i = 0; i < numRounds; i++) {
            const roundRes = await request(server).post(`/api/leagues/${leagueId}/rounds`);
            expect(roundRes.status).toBe(201);
            const roundId = roundRes.body.id;

            const assignRes = await request(server).get(`/api/rounds/${roundId}/assignments`);
            expect(assignRes.status).toBe(200);
            const assignedInRound = new Set<string>();
            for (const a of assignRes.body) {
              for (const pid of [...a.team1PlayerIds, ...a.team2PlayerIds]) {
                assignedInRound.add(pid);
              }
            }

            const byeRes = await request(server).get(`/api/leagues/${leagueId}/bye-counts`);
            expect(byeRes.status).toBe(200);
            for (const pid of playerIds) {
              const currentCount = byeRes.body[pid] ?? 0;
              if (assignedInRound.has(pid)) {
                expect(currentCount).toBe(prevByeCounts[pid]);
              } else {
                expect(currentCount).toBe(prevByeCounts[pid] + 1);
              }
            }
            prevByeCounts = { ...byeRes.body };
          }

          const finalByeRes = await request(server).get(`/api/leagues/${leagueId}/bye-counts`);
          expect(finalByeRes.status).toBe(200);
          const totalByes = Object.values(finalByeRes.body as Record<string, number>).reduce((sum: number, c: number) => sum + c, 0);
          expect(totalByes).toBe(numRounds);
        }),
        { numRuns: 50 }
      );
    }, 120000);
  });

  // Feature: e2e-integration-tests, Property 16: Round regeneration preserves past and recreates future
  // **Validates: Requirements 6.1, 6.5**
  describe('Property 16: Round regeneration preserves past and recreates future', () => {
    it('regenerating after round K should preserve rounds 1..K and produce new rounds for K+1..N, total count remains N', async () => {
      await fc.assert(
        fc.asyncProperty(leagueNameArb, fc.integer({ min: 2, max: 5 }), async (leagueName, totalRounds) => {
          resetState();
          const leagueRes = await request(server).post('/api/leagues').send({ name: leagueName, format: 'round_robin' });
          expect(leagueRes.status).toBe(201);
          const leagueId = leagueRes.body.id;

          for (const name of ['PlayerA', 'PlayerB', 'PlayerC', 'PlayerD']) {
            const r = await request(server).post(`/api/leagues/${leagueId}/players`).send({ name });
            expect(r.status).toBe(201);
          }
          await request(server).post(`/api/leagues/${leagueId}/courts`).send({ identifier: 'Court1' });

          for (let i = 0; i < totalRounds; i++) {
            const roundRes = await request(server).post(`/api/leagues/${leagueId}/rounds`);
            expect(roundRes.status).toBe(201);
          }

          const beforeRes = await request(server).get(`/api/leagues/${leagueId}/rounds`);
          expect(beforeRes.status).toBe(200);
          expect(beforeRes.body.length).toBe(totalRounds);

          const K = Math.floor(Math.random() * (totalRounds - 1)) + 1;
          const originalPreserved = beforeRes.body
            .filter((r: any) => r.roundNumber <= K)
            .map((r: any) => ({ id: r.id, roundNumber: r.roundNumber }));

          const regenRes = await request(server).post(`/api/leagues/${leagueId}/rounds/regenerate`).send({ afterRoundNumber: K });
          expect(regenRes.status).toBe(200);

          const afterRes = await request(server).get(`/api/leagues/${leagueId}/rounds`);
          expect(afterRes.status).toBe(200);
          expect(afterRes.body.length).toBe(totalRounds);

          for (const orig of originalPreserved) {
            const found = afterRes.body.find((r: any) => r.roundNumber === orig.roundNumber);
            expect(found).toBeDefined();
            expect(found.id).toBe(orig.id);
          }
          for (let rn = K + 1; rn <= totalRounds; rn++) {
            const found = afterRes.body.find((r: any) => r.roundNumber === rn);
            expect(found).toBeDefined();
          }
        }),
        { numRuns: 50 }
      );
    }, 120000);
  });

  // Feature: e2e-integration-tests, Property 17: Regeneration reflects roster changes
  // **Validates: Requirements 6.2, 6.3**
  describe('Property 17: Regeneration reflects roster changes', () => {
    it('adding a new player and regenerating should include them; removing a player and regenerating should exclude them', async () => {
      await fc.assert(
        fc.asyncProperty(leagueNameArb, playerNameArb, async (leagueName, newPlayerName) => {
          resetState();
          const leagueRes = await request(server).post('/api/leagues').send({ name: leagueName, format: 'round_robin' });
          expect(leagueRes.status).toBe(201);
          const leagueId = leagueRes.body.id;

          const basePlayerNames = ['P1', 'P2', 'P3', 'P4', 'P5'];
          for (const name of basePlayerNames) {
            const r = await request(server).post(`/api/leagues/${leagueId}/players`).send({ name });
            expect(r.status).toBe(201);
          }
          await request(server).post(`/api/leagues/${leagueId}/courts`).send({ identifier: 'Court1' });

          for (let i = 0; i < 3; i++) {
            const roundRes = await request(server).post(`/api/leagues/${leagueId}/rounds`);
            expect(roundRes.status).toBe(201);
          }

          // Part A: Add a new player and regenerate
          const addRes = await request(server).post(`/api/leagues/${leagueId}/players`).send({ name: newPlayerName });
          expect(addRes.status).toBe(201);
          const newPlayerId = addRes.body.id;

          const regenAddRes = await request(server).post(`/api/leagues/${leagueId}/rounds/regenerate`).send({ afterRoundNumber: 1 });
          expect(regenAddRes.status).toBe(200);

          let newPlayerFound = false;
          const regeneratedRoundsAdd = regenAddRes.body.filter((r: any) => r.roundNumber > 1);
          for (const round of regeneratedRoundsAdd) {
            const assignRes = await request(server).get(`/api/rounds/${round.id}/assignments`);
            expect(assignRes.status).toBe(200);
            const allIds = assignRes.body.flatMap((a: any) => [...a.team1PlayerIds, ...a.team2PlayerIds]);
            if (allIds.includes(newPlayerId)) { newPlayerFound = true; break; }
          }
          expect(newPlayerFound).toBe(true);

          // Part B: Remove the player and regenerate
          const deleteRes = await request(server).delete(`/api/players/${newPlayerId}`);
          expect(deleteRes.status).toBe(200);

          const regenRemoveRes = await request(server).post(`/api/leagues/${leagueId}/rounds/regenerate`).send({ afterRoundNumber: 1 });
          expect(regenRemoveRes.status).toBe(200);

          const regeneratedRoundsRemove = regenRemoveRes.body.filter((r: any) => r.roundNumber > 1);
          for (const round of regeneratedRoundsRemove) {
            const assignRes = await request(server).get(`/api/rounds/${round.id}/assignments`);
            expect(assignRes.status).toBe(200);
            const allIds = assignRes.body.flatMap((a: any) => [...a.team1PlayerIds, ...a.team2PlayerIds]);
            expect(allIds).not.toContain(newPlayerId);
          }
        }),
        { numRuns: 50 }
      );
    }, 120000);
  });

  // Feature: e2e-integration-tests, Property 18: Player uniqueness per round assignment
  // **Validates: Requirements 7.2**
  describe('Property 18: Player uniqueness per round assignment', () => {
    it('each player ID should appear in at most one assignment per round', async () => {
      await fc.assert(
        fc.asyncProperty(
          leagueNameArb,
          fc.integer({ min: 4, max: 8 }),
          fc.integer({ min: 1, max: 2 }),
          async (leagueName, numPlayers, numCourts) => {
            resetState();
            const leagueRes = await request(server).post('/api/leagues').send({ name: leagueName, format: 'round_robin' });
            expect(leagueRes.status).toBe(201);
            const leagueId = leagueRes.body.id;

            for (let i = 0; i < numPlayers; i++) {
              const r = await request(server).post(`/api/leagues/${leagueId}/players`).send({ name: `Player${i + 1}` });
              expect(r.status).toBe(201);
            }
            for (let i = 0; i < numCourts; i++) {
              const r = await request(server).post(`/api/leagues/${leagueId}/courts`).send({ identifier: `Court${i + 1}` });
              expect(r.status).toBe(201);
            }

            const roundRes = await request(server).post(`/api/leagues/${leagueId}/rounds`);
            expect(roundRes.status).toBe(201);
            const roundId = roundRes.body.id;

            const assignRes = await request(server).get(`/api/rounds/${roundId}/assignments`);
            expect(assignRes.status).toBe(200);

            const allPlayerIds: string[] = [];
            for (const assignment of assignRes.body) {
              for (const pid of [...assignment.team1PlayerIds, ...assignment.team2PlayerIds]) {
                allPlayerIds.push(pid);
              }
            }
            const uniquePlayerIds = new Set(allPlayerIds);
            expect(uniquePlayerIds.size).toBe(allPlayerIds.length);
          }
        ),
        { numRuns: 100 }
      );
    }, 60000);
  });

  // Feature: e2e-integration-tests, Property 19: Data isolation across leagues
  // **Validates: Requirements 11.1, 11.2, 12.1, 12.2, 12.3, 12.4**
  describe('Property 19: Data isolation across leagues', () => {
    it('two leagues should only see their own entities; deleting from one should not affect the other', async () => {
      await fc.assert(
        fc.asyncProperty(
          leagueNameArb, leagueNameArb,
          fc.array(playerNameArb, { minLength: 4, maxLength: 6 }),
          fc.array(playerNameArb, { minLength: 4, maxLength: 6 }),
          fc.array(courtIdentifierArb, { minLength: 1, maxLength: 2 }),
          fc.array(courtIdentifierArb, { minLength: 1, maxLength: 2 }),
          async (nameA, nameB, playersA, playersB, courtsA, courtsB) => {
            resetState();
            const leagueARes = await request(server).post('/api/leagues').send({ name: nameA, format: 'round_robin' });
            expect(leagueARes.status).toBe(201);
            const leagueAId = leagueARes.body.id;

            const leagueBRes = await request(server).post('/api/leagues').send({ name: nameB, format: 'round_robin' });
            expect(leagueBRes.status).toBe(201);
            const leagueBId = leagueBRes.body.id;

            const addedPlayersA: any[] = [];
            for (const pName of playersA) {
              const r = await request(server).post(`/api/leagues/${leagueAId}/players`).send({ name: pName });
              expect(r.status).toBe(201);
              addedPlayersA.push(r.body);
            }
            for (const pName of playersB) {
              const r = await request(server).post(`/api/leagues/${leagueBId}/players`).send({ name: pName });
              expect(r.status).toBe(201);
            }
            for (const cId of courtsA) {
              await request(server).post(`/api/leagues/${leagueAId}/courts`).send({ identifier: cId });
            }
            for (const cId of courtsB) {
              await request(server).post(`/api/leagues/${leagueBId}/courts`).send({ identifier: cId });
            }

            await request(server).post(`/api/leagues/${leagueAId}/rounds`);
            await request(server).post(`/api/leagues/${leagueBId}/rounds`);

            // Verify player isolation
            const listPlayersA = await request(server).get(`/api/leagues/${leagueAId}/players`);
            expect(listPlayersA.status).toBe(200);
            expect(listPlayersA.body.length).toBe(playersA.length);
            for (const p of listPlayersA.body) { expect(p.leagueId).toBe(leagueAId); }

            const listPlayersB = await request(server).get(`/api/leagues/${leagueBId}/players`);
            expect(listPlayersB.status).toBe(200);
            expect(listPlayersB.body.length).toBe(playersB.length);
            for (const p of listPlayersB.body) { expect(p.leagueId).toBe(leagueBId); }

            // Verify court isolation
            const listCourtsA = await request(server).get(`/api/leagues/${leagueAId}/courts`);
            expect(listCourtsA.body.length).toBe(courtsA.length);
            const listCourtsB = await request(server).get(`/api/leagues/${leagueBId}/courts`);
            expect(listCourtsB.body.length).toBe(courtsB.length);

            // Verify round isolation
            const listRoundsA = await request(server).get(`/api/leagues/${leagueAId}/rounds`);
            expect(listRoundsA.body.length).toBe(1);
            expect(listRoundsA.body[0].leagueId).toBe(leagueAId);
            const listRoundsB = await request(server).get(`/api/leagues/${leagueBId}/rounds`);
            expect(listRoundsB.body.length).toBe(1);
            expect(listRoundsB.body[0].leagueId).toBe(leagueBId);

            // Delete from A, verify B unaffected
            const playerToDelete = addedPlayersA[0];
            await request(server).delete(`/api/players/${playerToDelete.id}`);
            const afterDeleteA = await request(server).get(`/api/leagues/${leagueAId}/players`);
            expect(afterDeleteA.body.length).toBe(playersA.length - 1);
            const afterDeleteB = await request(server).get(`/api/leagues/${leagueBId}/players`);
            expect(afterDeleteB.body.length).toBe(playersB.length);
          }
        ),
        { numRuns: 100 }
      );
    }, 120000);
  });

  // Feature: e2e-integration-tests, Property 20: Error response structure consistency
  // **Validates: Requirements 11.1, 11.2, 12.1, 12.2**
  describe('Property 20: Error response structure consistency', () => {
    it('validation errors (400) should have error.code = VALIDATION_ERROR and a non-empty error.message', async () => {
      await fc.assert(
        fc.asyncProperty(leagueNameArb, async (randomName) => {
          resetState();
          const emptyBodyRes = await request(server).post('/api/leagues').send({});
          expect(emptyBodyRes.status).toBe(400);
          expect(emptyBodyRes.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
          expect(typeof emptyBodyRes.body.error.message).toBe('string');
          expect(emptyBodyRes.body.error.message.length).toBeGreaterThan(0);

          const invalidFormatRes = await request(server).post('/api/leagues').send({ name: randomName, format: 'invalid_format' });
          expect(invalidFormatRes.status).toBe(400);
          expect(invalidFormatRes.body.error).toHaveProperty('code', 'VALIDATION_ERROR');

          const leagueRes = await request(server).post('/api/leagues').send({ name: randomName, format: 'round_robin' });
          expect(leagueRes.status).toBe(201);
          const leagueId = leagueRes.body.id;

          const emptyPlayerRes = await request(server).post(`/api/leagues/${leagueId}/players`).send({ name: '' });
          expect(emptyPlayerRes.status).toBe(400);
          expect(emptyPlayerRes.body.error).toHaveProperty('code', 'VALIDATION_ERROR');

          const missingCourtRes = await request(server).post(`/api/leagues/${leagueId}/courts`).send({});
          expect(missingCourtRes.status).toBe(400);
          expect(missingCourtRes.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
        }),
        { numRuns: 100 }
      );
    }, 60000);

    it('not-found errors (404) should have error.code = NOT_FOUND and a non-empty error.message', async () => {
      await fc.assert(
        fc.asyncProperty(fc.uuid(), async (randomId) => {
          resetState();
          const leagueNotFoundRes = await request(server).get(`/api/leagues/${randomId}`);
          expect(leagueNotFoundRes.status).toBe(404);
          expect(leagueNotFoundRes.body.error).toHaveProperty('code', 'NOT_FOUND');
          expect(typeof leagueNotFoundRes.body.error.message).toBe('string');
          expect(leagueNotFoundRes.body.error.message.length).toBeGreaterThan(0);

          const playerNotFoundRes = await request(server).delete(`/api/players/${randomId}`);
          expect(playerNotFoundRes.status).toBe(404);
          expect(playerNotFoundRes.body.error).toHaveProperty('code', 'NOT_FOUND');

          const courtNotFoundRes = await request(server).delete(`/api/courts/${randomId}`);
          expect(courtNotFoundRes.status).toBe(404);
          expect(courtNotFoundRes.body.error).toHaveProperty('code', 'NOT_FOUND');
        }),
        { numRuns: 100 }
      );
    }, 60000);
  });
});
