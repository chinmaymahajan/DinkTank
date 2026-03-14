import React, { useState } from 'react';
import { Player } from '../types';

interface PlayerManagerProps {
  leagueId: string;
  players: Player[];
  onAddPlayer: (name: string) => Promise<void>;
}

/**
 * PlayerManager Component
 * 
 * Displays the list of players in the league and provides a form to add new players.
 * Includes validation for player names and displays validation errors.
 * 
 * Requirements: 1.1, 1.3, 1.4
 */
const PlayerManager: React.FC<PlayerManagerProps> = ({
  players,
  onAddPlayer
}) => {
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!playerName.trim()) {
      setError('Player name cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddPlayer(playerName);
      setPlayerName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add player');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="player-manager">
      <h2>Players</h2>
      
      <form onSubmit={handleSubmit} className="add-player-form">
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Type player name and press Enter"
          disabled={isSubmitting}
          className="player-input"
        />
      </form>

      {error && <div className="error-message">{error}</div>}

      <div className="player-list">
        {players.length === 0 ? (
          <p>No players added yet</p>
        ) : (
          <ul className="player-grid">
            {players.map((player) => (
              <li key={player.id}>{player.name}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PlayerManager;
