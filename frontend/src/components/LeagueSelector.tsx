import React, { useState } from 'react';
import { League, LeagueFormat } from '../types';
import FormatSelector from './FormatSelector';

interface LeagueSelectorProps {
  leagues: League[];
  selectedLeagueId: string | null;
  onSelect: (leagueId: string) => void;
  onCreateLeague?: (name: string, format: LeagueFormat) => Promise<void>;
}

/**
 * LeagueSelector Component
 * 
 * Displays a list of leagues and allows administrators to select the active league.
 * Shows the currently selected league and allows creating new leagues.
 * 
 * Requirements: 3.1, 3.3
 */
const LeagueSelector: React.FC<LeagueSelectorProps> = ({
  leagues,
  selectedLeagueId,
  onSelect,
  onCreateLeague
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [leagueName, setLeagueName] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<LeagueFormat>(LeagueFormat.ROUND_ROBIN);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!leagueName.trim()) {
      setError('League name cannot be empty');
      return;
    }

    if (!onCreateLeague) return;

    setIsSubmitting(true);
    try {
      await onCreateLeague(leagueName, selectedFormat);
      setLeagueName('');
      setSelectedFormat(LeagueFormat.ROUND_ROBIN);
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create league');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="league-selector">
      <h2>Select League</h2>
      {leagues.length === 0 ? (
        <p>No leagues available. Create one to get started!</p>
      ) : (
        <>
          <select
            value={selectedLeagueId || ''}
            onChange={(e) => onSelect(e.target.value)}
            className="league-select"
          >
            <option value="">-- Select a League --</option>
            {leagues.map((league) => (
              <option key={league.id} value={league.id}>
                {league.name} ({league.format === 'round_robin' ? 'Round Robin' : league.format})
              </option>
            ))}
          </select>
        </>
      )}

      {onCreateLeague && (
        <div className="create-league-section">
          {!showCreateForm ? (
            <button onClick={() => setShowCreateForm(true)} className="create-league-button">
              Create New League
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="create-league-form">
              <FormatSelector
                selectedFormat={selectedFormat}
                onSelect={setSelectedFormat}
                disabled={isSubmitting}
              />
              <input
                type="text"
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                placeholder="Enter league name"
                disabled={isSubmitting}
              />
              <div>
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setLeagueName('');
                    setSelectedFormat(LeagueFormat.ROUND_ROBIN);
                    setError(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          {error && <div className="error-message">{error}</div>}
        </div>
      )}
    </div>
  );
};

export default LeagueSelector;
