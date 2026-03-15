import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LeagueSelector from '../LeagueSelector';
import { League, LeagueFormat } from '../../types';

const makeLeague = (overrides: Partial<League> = {}): League => ({
  id: 'l1',
  name: 'DUPR',
  format: LeagueFormat.ROUND_ROBIN,
  createdAt: new Date('2026-03-15T10:00:00'),
  updatedAt: new Date('2026-03-15T12:00:00'),
  ...overrides,
});

describe('LeagueSelector — delete session', () => {
  it('should show delete button when onDeleteLeague is provided', () => {
    render(
      <LeagueSelector
        leagues={[makeLeague()]}
        selectedLeagueId={null}
        onSelect={jest.fn()}
        onDeleteLeague={jest.fn()}
      />
    );
    expect(screen.getByLabelText('Delete DUPR')).toBeInTheDocument();
  });

  it('should not show delete button when onDeleteLeague is not provided', () => {
    render(
      <LeagueSelector
        leagues={[makeLeague()]}
        selectedLeagueId={null}
        onSelect={jest.fn()}
      />
    );
    expect(screen.queryByLabelText('Delete DUPR')).not.toBeInTheDocument();
  });

  it('should show confirmation dialog when delete button is clicked', () => {
    render(
      <LeagueSelector
        leagues={[makeLeague()]}
        selectedLeagueId={null}
        onSelect={jest.fn()}
        onDeleteLeague={jest.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText('Delete DUPR'));

    expect(screen.getByText(/Delete "DUPR" session and all its data/)).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should call onDeleteLeague when confirmed', async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined);
    render(
      <LeagueSelector
        leagues={[makeLeague()]}
        selectedLeagueId={null}
        onSelect={jest.fn()}
        onDeleteLeague={onDelete}
      />
    );

    fireEvent.click(screen.getByLabelText('Delete DUPR'));
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith('l1');
    });
  });

  it('should dismiss confirmation when Cancel is clicked', () => {
    render(
      <LeagueSelector
        leagues={[makeLeague()]}
        selectedLeagueId={null}
        onSelect={jest.fn()}
        onDeleteLeague={jest.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText('Delete DUPR'));
    expect(screen.getByText(/Delete "DUPR" session/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText(/Delete "DUPR" session/)).not.toBeInTheDocument();
  });
});

describe('LeagueSelector — created date display', () => {
  it('should display the created date on session cards', () => {
    render(
      <LeagueSelector
        leagues={[makeLeague()]}
        selectedLeagueId={null}
        onSelect={jest.fn()}
      />
    );

    // Should show "Created" with a formatted date
    expect(screen.getByText(/Created/)).toBeInTheDocument();
  });
});
