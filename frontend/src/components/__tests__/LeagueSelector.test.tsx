import { render, screen, fireEvent } from '@testing-library/react';
import LeagueSelector from '../LeagueSelector';
import { League, LeagueFormat } from '../../types';

describe('LeagueSelector', () => {
  const mockLeagues: League[] = [
    {
      id: '1',
      name: 'Summer League',
      format: LeagueFormat.ROUND_ROBIN,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'Winter League',
      format: LeagueFormat.ROUND_ROBIN,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  it('should render league options', () => {
    const mockOnSelect = jest.fn();
    
    render(
      <LeagueSelector
        leagues={mockLeagues}
        selectedLeagueId={null}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Select League')).toBeInTheDocument();
    expect(screen.getByText(/Summer League \(Round Robin\)/)).toBeInTheDocument();
    expect(screen.getByText(/Winter League \(Round Robin\)/)).toBeInTheDocument();
  });

  it('should call onSelect when a league is selected', () => {
    const mockOnSelect = jest.fn();
    
    render(
      <LeagueSelector
        leagues={mockLeagues}
        selectedLeagueId={null}
        onSelect={mockOnSelect}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    expect(mockOnSelect).toHaveBeenCalledWith('1');
  });

  it('should display currently selected league', () => {
    const mockOnSelect = jest.fn();
    
    render(
      <LeagueSelector
        leagues={mockLeagues}
        selectedLeagueId="1"
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText(/Currently selected: Summer League/)).toBeInTheDocument();
  });

  it('should show message when no leagues available', () => {
    const mockOnSelect = jest.fn();
    
    render(
      <LeagueSelector
        leagues={[]}
        selectedLeagueId={null}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText(/No leagues available/)).toBeInTheDocument();
  });
});
