import { League, LeagueFormat } from '../models/League';
import { dataStore } from '../data/DataStore';

/**
 * Service for managing leagues
 * Provides league creation, retrieval, listing, and selection
 */
export class LeagueService {
  private selectedLeagueId: string | null = null;

  /**
   * Create a new league
   * 
   * @param name - The name of the league
   * @param format - The format of the league (defaults to Round Robin)
   * @returns The created league
   */
  createLeague(name: string, format: LeagueFormat = LeagueFormat.ROUND_ROBIN): League {
    const now = new Date();
    const league: League = {
      id: dataStore.generateId(),
      name,
      format,
      createdAt: now,
      updatedAt: now
    };

    return dataStore.createLeague(league);
  }

  /**
   * Get a specific league by ID
   * 
   * @param leagueId - The ID of the league to retrieve
   * @returns The league if found, undefined otherwise
   */
  getLeague(leagueId: string): League | undefined {
    return dataStore.getLeague(leagueId);
  }

  /**
   * List all leagues
   * 
   * @returns Array of all leagues
   */
  listLeagues(): League[] {
    return dataStore.getAllLeagues();
  }

  /**
   * Select a league as the active league
   * 
   * @param leagueId - The ID of the league to select
   * @throws Error if league not found
   */
  selectLeague(leagueId: string): void {
    const league = dataStore.getLeague(leagueId);
    if (!league) {
      throw new Error('League not found');
    }
    this.selectedLeagueId = leagueId;
  }

  /**
   * Get the currently selected league ID
   * 
   * @returns The selected league ID or null if none selected
   */
  getSelectedLeagueId(): string | null {
    return this.selectedLeagueId;
  }

  /**
   * Clear the selected league (primarily for testing)
   */
  clearSelection(): void {
    this.selectedLeagueId = null;
  }
}

// Export singleton instance
export const leagueService = new LeagueService();
