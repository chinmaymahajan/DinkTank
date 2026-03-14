import { League } from '../models/League';
import { Player } from '../models/Player';
import { Court } from '../models/Court';
import { Round } from '../models/Round';
import { Assignment } from '../models/Assignment';

/**
 * In-memory data store for all entities
 * Provides CRUD operations and ID generation
 */
class DataStore {
  private leagues: Map<string, League> = new Map();
  private players: Map<string, Player> = new Map();
  private courts: Map<string, Court> = new Map();
  private rounds: Map<string, Round> = new Map();
  private assignments: Map<string, Assignment> = new Map();
  
  private idCounter = 0;

  /**
   * Generate a unique ID for entities
   */
  generateId(): string {
    return `id_${++this.idCounter}_${Date.now()}`;
  }

  // League CRUD operations
  createLeague(league: League): League {
    this.leagues.set(league.id, league);
    return league;
  }

  getLeague(id: string): League | undefined {
    return this.leagues.get(id);
  }

  getAllLeagues(): League[] {
    return Array.from(this.leagues.values());
  }

  updateLeague(id: string, updates: Partial<League>): League | undefined {
    const league = this.leagues.get(id);
    if (!league) return undefined;
    
    const updated = { ...league, ...updates, id };
    this.leagues.set(id, updated);
    return updated;
  }

  deleteLeague(id: string): boolean {
    return this.leagues.delete(id);
  }

  // Player CRUD operations
  createPlayer(player: Player): Player {
    this.players.set(player.id, player);
    return player;
  }

  getPlayer(id: string): Player | undefined {
    return this.players.get(id);
  }

  getPlayersByLeague(leagueId: string): Player[] {
    return Array.from(this.players.values())
      .filter(player => player.leagueId === leagueId);
  }

  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  updatePlayer(id: string, updates: Partial<Player>): Player | undefined {
    const player = this.players.get(id);
    if (!player) return undefined;
    
    const updated = { ...player, ...updates, id };
    this.players.set(id, updated);
    return updated;
  }

  deletePlayer(id: string): boolean {
    return this.players.delete(id);
  }

  // Court CRUD operations
  createCourt(court: Court): Court {
    this.courts.set(court.id, court);
    return court;
  }

  getCourt(id: string): Court | undefined {
    return this.courts.get(id);
  }

  getCourtsByLeague(leagueId: string): Court[] {
    return Array.from(this.courts.values())
      .filter(court => court.leagueId === leagueId);
  }

  getAllCourts(): Court[] {
    return Array.from(this.courts.values());
  }

  updateCourt(id: string, updates: Partial<Court>): Court | undefined {
    const court = this.courts.get(id);
    if (!court) return undefined;
    
    const updated = { ...court, ...updates, id };
    this.courts.set(id, updated);
    return updated;
  }

  deleteCourt(id: string): boolean {
    return this.courts.delete(id);
  }

  // Round CRUD operations
  createRound(round: Round): Round {
    this.rounds.set(round.id, round);
    return round;
  }

  getRound(id: string): Round | undefined {
    return this.rounds.get(id);
  }

  getRoundsByLeague(leagueId: string): Round[] {
    return Array.from(this.rounds.values())
      .filter(round => round.leagueId === leagueId)
      .sort((a, b) => a.roundNumber - b.roundNumber);
  }

  getAllRounds(): Round[] {
    return Array.from(this.rounds.values());
  }

  updateRound(id: string, updates: Partial<Round>): Round | undefined {
    const round = this.rounds.get(id);
    if (!round) return undefined;
    
    const updated = { ...round, ...updates, id };
    this.rounds.set(id, updated);
    return updated;
  }

  deleteRound(id: string): boolean {
    return this.rounds.delete(id);
  }

  // Assignment CRUD operations
  createAssignment(assignment: Assignment): Assignment {
    this.assignments.set(assignment.id, assignment);
    return assignment;
  }

  getAssignment(id: string): Assignment | undefined {
    return this.assignments.get(id);
  }

  getAssignmentsByRound(roundId: string): Assignment[] {
    return Array.from(this.assignments.values())
      .filter(assignment => assignment.roundId === roundId);
  }

  getAllAssignments(): Assignment[] {
    return Array.from(this.assignments.values());
  }

  updateAssignment(id: string, updates: Partial<Assignment>): Assignment | undefined {
    const assignment = this.assignments.get(id);
    if (!assignment) return undefined;
    
    const updated = { ...assignment, ...updates, id };
    this.assignments.set(id, updated);
    return updated;
  }

  deleteAssignment(id: string): boolean {
    return this.assignments.delete(id);
  }

  // Utility methods
  clear(): void {
    this.leagues.clear();
    this.players.clear();
    this.courts.clear();
    this.rounds.clear();
    this.assignments.clear();
    this.idCounter = 0;
  }
}

// Export singleton instance
export const dataStore = new DataStore();
