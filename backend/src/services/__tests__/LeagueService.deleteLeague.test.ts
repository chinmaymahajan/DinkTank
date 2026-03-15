import { leagueService } from '../LeagueService';
import { assignmentService } from '../AssignmentService';
import { dataStore } from '../../data/DataStore';
import { LeagueFormat } from '../../models/League';

describe('LeagueService.deleteLeague', () => {
  beforeEach(() => {
    dataStore.clear();
    leagueService.clearSelection();
  });

  it('should delete a league by ID', () => {
    const league = leagueService.createLeague('Test League');
    leagueService.deleteLeague(league.id);
    expect(leagueService.getLeague(league.id)).toBeUndefined();
    expect(leagueService.listLeagues()).toHaveLength(0);
  });

  it('should throw error when deleting non-existent league', () => {
    expect(() => leagueService.deleteLeague('non-existent')).toThrow('League not found');
  });

  it('should cascade delete all players in the league', () => {
    const league = leagueService.createLeague('Test League');
    dataStore.createPlayer({ id: 'p1', leagueId: league.id, name: 'Alice', createdAt: new Date() });
    dataStore.createPlayer({ id: 'p2', leagueId: league.id, name: 'Bob', createdAt: new Date() });

    leagueService.deleteLeague(league.id);

    expect(dataStore.getPlayersByLeague(league.id)).toHaveLength(0);
    expect(dataStore.getPlayer('p1')).toBeUndefined();
    expect(dataStore.getPlayer('p2')).toBeUndefined();
  });

  it('should cascade delete all courts in the league', () => {
    const league = leagueService.createLeague('Test League');
    dataStore.createCourt({ id: 'c1', leagueId: league.id, identifier: 'Court 1', createdAt: new Date() });
    dataStore.createCourt({ id: 'c2', leagueId: league.id, identifier: 'Court 2', createdAt: new Date() });

    leagueService.deleteLeague(league.id);

    expect(dataStore.getCourtsByLeague(league.id)).toHaveLength(0);
    expect(dataStore.getCourt('c1')).toBeUndefined();
  });

  it('should cascade delete all rounds and their assignments', () => {
    const league = leagueService.createLeague('Test League');
    const players = Array.from({ length: 4 }, (_, i) => {
      const p = { id: `p${i}`, leagueId: league.id, name: `Player ${i}`, createdAt: new Date() };
      dataStore.createPlayer(p);
      return p;
    });
    const court = { id: 'c1', leagueId: league.id, identifier: 'Court 1', createdAt: new Date() };
    dataStore.createCourt(court);

    const round = { id: 'r1', leagueId: league.id, roundNumber: 1, createdAt: new Date() };
    dataStore.createRound(round);
    assignmentService.generateAssignments(players, [court], round.id);

    expect(dataStore.getAssignmentsByRound('r1').length).toBeGreaterThan(0);

    leagueService.deleteLeague(league.id);

    expect(dataStore.getRoundsByLeague(league.id)).toHaveLength(0);
    expect(dataStore.getAssignmentsByRound('r1')).toHaveLength(0);
  });

  it('should clear selection if deleted league was selected', () => {
    const league = leagueService.createLeague('Test League');
    leagueService.selectLeague(league.id);
    expect(leagueService.getSelectedLeagueId()).toBe(league.id);

    leagueService.deleteLeague(league.id);

    expect(leagueService.getSelectedLeagueId()).toBeNull();
  });

  it('should not clear selection if a different league was selected', () => {
    const league1 = leagueService.createLeague('League 1');
    const league2 = leagueService.createLeague('League 2');
    leagueService.selectLeague(league1.id);

    leagueService.deleteLeague(league2.id);

    expect(leagueService.getSelectedLeagueId()).toBe(league1.id);
  });

  it('should not affect other leagues when deleting one', () => {
    const league1 = leagueService.createLeague('League 1');
    const league2 = leagueService.createLeague('League 2');
    dataStore.createPlayer({ id: 'p1', leagueId: league1.id, name: 'Alice', createdAt: new Date() });
    dataStore.createPlayer({ id: 'p2', leagueId: league2.id, name: 'Bob', createdAt: new Date() });

    leagueService.deleteLeague(league1.id);

    expect(leagueService.getLeague(league2.id)).toBeDefined();
    expect(dataStore.getPlayersByLeague(league2.id)).toHaveLength(1);
  });
});
