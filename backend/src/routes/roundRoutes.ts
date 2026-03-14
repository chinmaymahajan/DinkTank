import { Router, Request, Response } from 'express';
import { roundService } from '../services/RoundService';
import { assignmentService } from '../services/AssignmentService';

const router = Router();

/**
 * POST /api/leagues/:leagueId/rounds
 * Generate a new round for a league
 */
router.post('/leagues/:leagueId/rounds', (req: Request, res: Response) => {
  try {
    const { leagueId } = req.params;
    
    const round = roundService.generateRound(leagueId);
    res.status(201).json(round);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('no players in session') || error.message.includes('no courts in session')) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
      }
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate round',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * GET /api/leagues/:leagueId/rounds
 * List all rounds for a league
 */
router.get('/leagues/:leagueId/rounds', (req: Request, res: Response) => {
  try {
    const { leagueId } = req.params;
    const rounds = roundService.listRounds(leagueId);
    res.json(rounds);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list rounds',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * GET /api/leagues/:leagueId/rounds/current
 * Get the current (most recent) round for a league
 */
router.get('/leagues/:leagueId/rounds/current', (req: Request, res: Response) => {
  try {
    const { leagueId } = req.params;
    const round = roundService.getCurrentRound(leagueId);
    res.json(round);
  } catch (error) {
    if (error instanceof Error && error.message === 'No rounds found for league') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get current round',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * GET /api/leagues/:leagueId/rounds/:roundNumber
 * Get a specific round by round number
 */
router.get('/leagues/:leagueId/rounds/:roundNumber', (req: Request, res: Response) => {
  try {
    const { leagueId, roundNumber } = req.params;
    const roundNum = parseInt(roundNumber, 10);
    
    if (isNaN(roundNum) || roundNum < 1) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Round number must be a positive integer'
        }
      });
    }
    
    const round = roundService.getRound(leagueId, roundNum);
    res.json(round);
  } catch (error) {
    if (error instanceof Error && error.message === 'Round not found') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: error.message
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get round',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * GET /api/leagues/:leagueId/bye-counts
 * Get bye counts for all players across all rounds
 */
router.get('/leagues/:leagueId/bye-counts', (req: Request, res: Response) => {
  try {
    const { leagueId } = req.params;
    const byeCounts = roundService.getByeCounts(leagueId);
    res.json(byeCounts);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get bye counts',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * GET /api/rounds/:roundId/assignments
 * Get all assignments for a specific round
 */
router.get('/rounds/:roundId/assignments', (req: Request, res: Response) => {
  try {
    const { roundId } = req.params;
    const assignments = assignmentService.getAssignments(roundId);
    res.json(assignments);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get assignments',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * PUT /api/rounds/:roundId/assignments
 * Update assignments for a round with manual reassignments
 */
router.put('/rounds/:roundId/assignments', (req: Request, res: Response) => {
  try {
    const { roundId } = req.params;
    const { assignments } = req.body;
    
    // Validate request body
    if (!assignments || !Array.isArray(assignments)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body must include an "assignments" array'
        }
      });
    }
    
    // Validate each assignment has required fields
    for (const assignment of assignments) {
      if (!assignment.courtId || !assignment.team1PlayerIds || !assignment.team2PlayerIds) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Each assignment must include courtId, team1PlayerIds, and team2PlayerIds'
          }
        });
      }
      
      if (!Array.isArray(assignment.team1PlayerIds) || !Array.isArray(assignment.team2PlayerIds)) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'team1PlayerIds and team2PlayerIds must be arrays'
          }
        });
      }
    }
    
    // Call service to reassign players
    const updatedAssignments = assignmentService.reassignPlayers(roundId, assignments);
    
    res.json(updatedAssignments);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: error.message
          }
        });
      }
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update assignments',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

export default router;
