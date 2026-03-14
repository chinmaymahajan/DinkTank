import { leagueService } from '../LeagueService';
import { dataStore } from '../../data/DataStore';
import { LeagueFormat } from '../../models/League';

describe('LeagueService', () => {
  beforeEach(() => {
    dataStore.clear();
    leagueService.clearSelection();
  });

  describe('createLeague', () => {
    it('should create a league with a valid name', () => {
      const leagueName = 'Summer League 2024';

      const league = leagueService.createLeague(leagueName);

      expect(league).toBeDefined();
      expect(league.id).toBeDefined();
      expect(league.name).toBe(leagueName);
      expect(league.format).toBe(LeagueFormat.ROUND_ROBIN);
      expect(league.createdAt).toBeInstanceOf(Date);
      expect(league.updatedAt).toBeInstanceOf(Date);
      expect(league.createdAt).toEqual(league.updatedAt);
    });

    it('should create a league with specified format', () => {
      const leagueName = 'Tournament League';
      const format = LeagueFormat.ROUND_ROBIN;

      const league = leagueService.createLeague(leagueName, format);

      expect(league.format).toBe(format);
    });

    it('should store league in data store', () => {
      const leagueName = 'Winter League 2024';

      const league = leagueService.createLeague(leagueName);
      const retrieved = dataStore.getLeague(league.id);

      expect(retrieved).toEqual(league);
    });

    it('should create multiple leagues with unique IDs', () => {
      const league1 = leagueService.createLeague('League 1');
      const league2 = leagueService.createLeague('League 2');
      const league3 = leagueService.createLeague('League 3');

      expect(league1.id).not.toBe(league2.id);
      expect(league2.id).not.toBe(league3.id);
      expect(league1.id).not.toBe(league3.id);
    });
  });

  describe('getLeague', () => {
    it('should return a league by ID', () => {
      const league = leagueService.createLeague('Test League');

      const retrieved = leagueService.getLeague(league.id);

      expect(retrieved).toEqual(league);
    });

    it('should return undefined for non-existent league', () => {
      const retrieved = leagueService.getLeague('non-existent-id');

      expect(retrieved).toBeUndefined();
    });

    it('should return the correct league when multiple leagues exist', () => {
      const league1 = leagueService.createLeague('League 1');
      const league2 = leagueService.createLeague('League 2');
      const league3 = leagueService.createLeague('League 3');

      const retrieved = leagueService.getLeague(league2.id);

      expect(retrieved).toEqual(league2);
      expect(retrieved).not.toEqual(league1);
      expect(retrieved).not.toEqual(league3);
    });
  });

  describe('listLeagues', () => {
    it('should return empty array when no leagues exist', () => {
      const leagues = leagueService.listLeagues();

      expect(leagues).toEqual([]);
    });

    it('should return all leagues', () => {
      const league1 = leagueService.createLeague('League 1');
      const league2 = leagueService.createLeague('League 2');
      const league3 = leagueService.createLeague('League 3');

      const leagues = leagueService.listLeagues();

      expect(leagues).toHaveLength(3);
      expect(leagues).toContainEqual(league1);
      expect(leagues).toContainEqual(league2);
      expect(leagues).toContainEqual(league3);
    });

    it('should return updated list after creating new league', () => {
      const league1 = leagueService.createLeague('League 1');
      
      let leagues = leagueService.listLeagues();
      expect(leagues).toHaveLength(1);

      const league2 = leagueService.createLeague('League 2');
      
      leagues = leagueService.listLeagues();
      expect(leagues).toHaveLength(2);
      expect(leagues).toContainEqual(league1);
      expect(leagues).toContainEqual(league2);
    });
  });

  describe('selectLeague', () => {
    it('should select a valid league', () => {
      const league = leagueService.createLeague('Test League');

      expect(() => {
        leagueService.selectLeague(league.id);
      }).not.toThrow();

      expect(leagueService.getSelectedLeagueId()).toBe(league.id);
    });

    it('should throw error for non-existent league', () => {
      expect(() => {
        leagueService.selectLeague('non-existent-id');
      }).toThrow('League not found');
    });

    it('should update selected league when selecting different league', () => {
      const league1 = leagueService.createLeague('League 1');
      const league2 = leagueService.createLeague('League 2');

      leagueService.selectLeague(league1.id);
      expect(leagueService.getSelectedLeagueId()).toBe(league1.id);

      leagueService.selectLeague(league2.id);
      expect(leagueService.getSelectedLeagueId()).toBe(league2.id);
    });

    it('should maintain selected league across multiple operations', () => {
      const league1 = leagueService.createLeague('League 1');
      const league2 = leagueService.createLeague('League 2');

      leagueService.selectLeague(league1.id);
      
      // Perform other operations
      leagueService.listLeagues();
      leagueService.getLeague(league2.id);
      
      // Selected league should remain unchanged
      expect(leagueService.getSelectedLeagueId()).toBe(league1.id);
    });
  });

  describe('getSelectedLeagueId', () => {
    it('should return null when no league is selected', () => {
      expect(leagueService.getSelectedLeagueId()).toBeNull();
    });

    it('should return the selected league ID', () => {
      const league = leagueService.createLeague('Test League');
      leagueService.selectLeague(league.id);

      expect(leagueService.getSelectedLeagueId()).toBe(league.id);
    });
  });
});
