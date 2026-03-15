import request from 'supertest';
import app from '../../index';
import { dataStore } from '../../data/DataStore';
import { leagueService } from '../../services/LeagueService';

export { app, request, dataStore, leagueService };

export async function createLeague(name: string, format?: string) {
  return request(app)
    .post('/api/leagues')
    .send({ name, format: format || 'round_robin' });
}

export async function addPlayers(leagueId: string, names: string[]) {
  const players = [];
  for (const name of names) {
    const res = await request(app)
      .post(`/api/leagues/${leagueId}/players`)
      .send({ name });
    players.push(res.body);
  }
  return players;
}

export async function addCourts(leagueId: string, identifiers: string[]) {
  const courts = [];
  for (const identifier of identifiers) {
    const res = await request(app)
      .post(`/api/leagues/${leagueId}/courts`)
      .send({ identifier });
    courts.push(res.body);
  }
  return courts;
}

export async function generateRound(leagueId: string) {
  return request(app).post(`/api/leagues/${leagueId}/rounds`);
}

export function resetState() {
  dataStore.clear();
  leagueService.clearSelection();
}
