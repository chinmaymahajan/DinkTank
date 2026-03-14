import { render, screen } from '@testing-library/react';
import PlayerManager from '../PlayerManager';
import { Player } from '../../types';

describe('PlayerManager', () => {
  const mockPlayers: Player[] = [
    {
      id: '1',
      leagueId: 'league1',
      name: 'John Doe',
      createdAt: new Date()
    },
    {
      id: '2',
      leagueId: 'league1',
      name: 'Jane Smith',
      createdAt: new Date()
    }
  ];

  it('should render player list', () => {
    const mockOnAddPlayer = jest.fn();
    
    render(
      <PlayerManager
        leagueId="league1"
        players={mockPlayers}
        onAddPlayer={mockOnAddPlayer}
      />
    );

    expect(screen.getByText('Players')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should show message when no players exist', () => {
    const mockOnAddPlayer = jest.fn();
    
    render(
      <PlayerManager
        leagueId="league1"
        players={[]}
        onAddPlayer={mockOnAddPlayer}
      />
    );

    expect(screen.getByText('No players added yet')).toBeInTheDocument();
  });
});
