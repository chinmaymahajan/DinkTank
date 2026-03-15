import { app, request, resetState } from './helpers';
import { leagueService } from '../../services/LeagueService';

describe('Error Handling Integration Tests', () => {
  beforeEach(() => {
    resetState();
  });

  // B12.1: Validation error response structure
  // Validates: Requirement 11.1
  it('should return a structured validation error with VALIDATION_ERROR code and message', async () => {
    const res = await request(app)
      .post('/api/leagues')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    expect(res.body.error).toHaveProperty('message');
    expect(typeof res.body.error.message).toBe('string');
    expect(res.body.error.message.length).toBeGreaterThan(0);
  });

  // B12.2: Not-found error response structure
  // Validates: Requirement 11.2
  it('should return a structured not-found error with NOT_FOUND code and message', async () => {
    const res = await request(app)
      .get('/api/leagues/non-existent-id');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    expect(res.body.error).toHaveProperty('message');
    expect(typeof res.body.error.message).toBe('string');
    expect(res.body.error.message.length).toBeGreaterThan(0);
  });

  // B12.3: Internal error response structure
  // Validates: Requirement 11.3
  it('should return a structured internal error with INTERNAL_ERROR code on unexpected errors', async () => {
    // Mock leagueService.listLeagues to throw an unexpected error
    const originalListLeagues = leagueService.listLeagues.bind(leagueService);
    leagueService.listLeagues = () => {
      throw new Error('Unexpected database failure');
    };

    try {
      const res = await request(app)
        .get('/api/leagues');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('code', 'INTERNAL_ERROR');
    } finally {
      // Restore original method
      leagueService.listLeagues = originalListLeagues;
    }
  });
});
