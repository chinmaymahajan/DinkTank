import { AssignmentService } from '../AssignmentService';
import { dataStore } from '../../data/DataStore';
import { Player } from '../../models/Player';
import { Court } from '../../models/Court';

describe('AssignmentService — bye fairness', () => {
  let service: AssignmentService;
  const leagueId = 'test-league';

  beforeEach(() => {
    service = new AssignmentService();
    dataStore.clear();
  });

  const makePlayers = (count: number): Player[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `p${i + 1}`,
      leagueId,
      name: `Player ${i + 1}`,
      createdAt: new Date(),
    }));

  const makeCourts = (count: number): Court[] =>
    Array.from({ length: count }, (_, i) => {
      const c = { id: `c${i + 1}`, leagueId, identifier: `Court ${i + 1}`, createdAt: new Date() };
      dataStore.createCourt(c);
      return c;
    });

  it('should prioritize players with most byes', () => {
    const players = makePlayers(6);
    const courts = makeCourts(1); // 4 slots, 2 byes per round

    // p1 and p2 have 2 byes each, others have 0
    const byeCountMap = new Map<string, number>([
      ['p1', 2], ['p2', 2], ['p3', 0], ['p4', 0], ['p5', 0], ['p6', 0],
    ]);

    // Run multiple times — p1 and p2 should always be assigned (never on bye)
    for (let i = 0; i < 20; i++) {
      dataStore.clear();
      courts.forEach(c => dataStore.createCourt(c));

      const assignments = service.generateAssignments(players, courts, `r${i}`, 4, undefined, byeCountMap);
      const assigned = new Set([
        ...assignments[0].team1PlayerIds,
        ...assignments[0].team2PlayerIds,
      ]);

      expect(assigned.has('p1')).toBe(true);
      expect(assigned.has('p2')).toBe(true);
    }
  });

  it('should distribute byes evenly across multiple rounds', () => {
    const players = makePlayers(10);
    const courts = makeCourts(2); // 8 slots, 2 byes per round

    const byeCounts = new Map<string, number>();
    players.forEach(p => byeCounts.set(p.id, 0));

    // Simulate 10 rounds
    for (let round = 0; round < 10; round++) {
      dataStore.clear();
      courts.forEach(c => dataStore.createCourt(c));

      const assignments = service.generateAssignments(players, courts, `r${round}`, 4, undefined, byeCounts);
      const assigned = new Set<string>();
      for (const a of assignments) {
        a.team1PlayerIds.forEach(id => assigned.add(id));
        a.team2PlayerIds.forEach(id => assigned.add(id));
      }

      // Increment bye counts for unassigned players
      for (const p of players) {
        if (!assigned.has(p.id)) {
          byeCounts.set(p.id, (byeCounts.get(p.id) || 0) + 1);
        }
      }
    }

    // After 10 rounds with 2 byes each = 20 total byes across 10 players = 2 each ideally
    const counts = [...byeCounts.values()];
    const max = Math.max(...counts);
    const min = Math.min(...counts);

    // The spread should be at most 1 (perfect fairness) or 2 (acceptable)
    expect(max - min).toBeLessThanOrEqual(2);
    // No player should have more than 3 byes in 10 rounds
    expect(max).toBeLessThanOrEqual(3);
  });

  it('should only fill full courts (no partial assignments)', () => {
    const players = makePlayers(10);
    const courts = makeCourts(3); // 12 slots but only 10 players → 2 full courts

    const assignments = service.generateAssignments(players, courts, 'r1');

    // Should create exactly 2 assignments (2 full courts of 4)
    expect(assignments).toHaveLength(2);
    for (const a of assignments) {
      expect(a.team1PlayerIds).toHaveLength(2);
      expect(a.team2PlayerIds).toHaveLength(2);
    }
  });

  it('should assign all players when they exactly fill courts', () => {
    const players = makePlayers(8);
    const courts = makeCourts(2); // 8 slots, 8 players — perfect fit

    const assignments = service.generateAssignments(players, courts, 'r1');

    expect(assignments).toHaveLength(2);
    const assigned = new Set<string>();
    for (const a of assignments) {
      a.team1PlayerIds.forEach(id => assigned.add(id));
      a.team2PlayerIds.forEach(id => assigned.add(id));
    }
    expect(assigned.size).toBe(8);
  });
});
