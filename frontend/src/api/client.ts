import { League, Player, Court, Round, Assignment, ErrorResponse, LeagueFormat } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(public code: string, message: string, public details?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw new ApiError(
      errorData.error.code,
      errorData.error.message,
      errorData.error.details
    );
  }
  return response.json();
}

export const api = {
  // League endpoints
  async createLeague(name: string, format: LeagueFormat = LeagueFormat.ROUND_ROBIN): Promise<League> {
    const response = await fetch(`${API_BASE_URL}/leagues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, format })
    });
    return handleResponse<League>(response);
  },

  async listLeagues(): Promise<League[]> {
    const response = await fetch(`${API_BASE_URL}/leagues`);
    return handleResponse<League[]>(response);
  },

  async getLeague(leagueId: string): Promise<League> {
    const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}`);
    return handleResponse<League>(response);
  },

  async selectLeague(leagueId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}/select`, {
      method: 'POST'
    });
    await handleResponse(response);
  },

  // Player endpoints
  async addPlayer(leagueId: string, name: string): Promise<Player> {
    const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    return handleResponse<Player>(response);
  },

  async getPlayers(leagueId: string): Promise<Player[]> {
    const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}/players`);
    return handleResponse<Player[]>(response);
  },

  // Court endpoints
  async addCourt(leagueId: string, identifier: string): Promise<Court> {
    const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}/courts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier })
    });
    return handleResponse<Court>(response);
  },

  async getCourts(leagueId: string): Promise<Court[]> {
    const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}/courts`);
    return handleResponse<Court[]>(response);
  },

  // Round endpoints
  async generateRound(leagueId: string): Promise<Round> {
    const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}/rounds`, {
      method: 'POST'
    });
    return handleResponse<Round>(response);
  },

  async listRounds(leagueId: string): Promise<Round[]> {
    const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}/rounds`);
    return handleResponse<Round[]>(response);
  },

  async getRound(leagueId: string, roundNumber: number): Promise<Round> {
    const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}/rounds/${roundNumber}`);
    return handleResponse<Round>(response);
  },

  async getCurrentRound(leagueId: string): Promise<Round> {
    const response = await fetch(`${API_BASE_URL}/leagues/${leagueId}/rounds/current`);
    return handleResponse<Round>(response);
  },

  // Assignment endpoints
  async getAssignments(roundId: string): Promise<Assignment[]> {
    const response = await fetch(`${API_BASE_URL}/rounds/${roundId}/assignments`);
    return handleResponse<Assignment[]>(response);
  },

  async updateAssignments(
    roundId: string,
    assignments: Array<{
      courtId: string;
      team1PlayerIds: string[];
      team2PlayerIds: string[];
    }>
  ): Promise<Assignment[]> {
    const response = await fetch(`${API_BASE_URL}/rounds/${roundId}/assignments`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignments })
    });
    return handleResponse<Assignment[]>(response);
  },

  // Dev endpoints
  async seedMockData(): Promise<{ league: League; players: number; courts: number }> {
    const response = await fetch(`${API_BASE_URL}/dev/seed`, {
      method: 'POST'
    });
    const result = await handleResponse<{ message: string; data: any }>(response);
    return result.data;
  },

  async clearAllData(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/dev/clear`, {
      method: 'POST'
    });
    await handleResponse(response);
  }
};
