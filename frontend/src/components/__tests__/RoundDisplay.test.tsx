import { render, screen } from '@testing-library/react';
import RoundDisplay from '../RoundDisplay';
import { Round, Assignment, Court, Player } from '../../types';

describe('RoundDisplay', () => {
  const mockRound: Round = {
    id: 'round1',
    leagueId: 'league1',
    roundNumber: 1,
    createdAt: new Date()
  };

  const mockCourts: Court[] = [
    { id: 'court1', leagueId: 'league1', identifier: 'Court 1', createdAt: new Date() },
    { id: 'court2', leagueId: 'league1', identifier: 'Court 2', createdAt: new Date() }
  ];

  const mockPlayers: Player[] = [
    { id: 'p1', leagueId: 'league1', name: 'Player 1', createdAt: new Date() },
    { id: 'p2', leagueId: 'league1', name: 'Player 2', createdAt: new Date() },
    { id: 'p3', leagueId: 'league1', name: 'Player 3', createdAt: new Date() },
    { id: 'p4', leagueId: 'league1', name: 'Player 4', createdAt: new Date() }
  ];

  const mockAssignments: Assignment[] = [
    {
      id: 'a1',
      roundId: 'round1',
      courtId: 'court1',
      team1PlayerIds: ['p1', 'p2'],
      team2PlayerIds: ['p3', 'p4'],
      createdAt: new Date()
    }
  ];

  it('should display round number', () => {
    render(
      <RoundDisplay
        round={mockRound}
        assignments={mockAssignments}
        courts={mockCourts}
        players={mockPlayers}
      />
    );

    expect(screen.getByText('Round 1')).toBeInTheDocument();
  });

  it('should display court assignments with player names', () => {
    render(
      <RoundDisplay
        round={mockRound}
        assignments={mockAssignments}
        courts={mockCourts}
        players={mockPlayers}
      />
    );

    expect(screen.getByText('Court 1')).toBeInTheDocument();
    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByText('Player 2')).toBeInTheDocument();
  });
});
