import React, { useState, useRef, useEffect } from 'react';
import { Player } from '../types';

interface PlayerManagerProps {
  leagueId: string;
  players: Player[];
  onAddPlayer: (name: string) => Promise<void>;
  onRemovePlayer: (playerId: string) => Promise<void>;
}

const PlayerManager: React.FC<PlayerManagerProps> = ({
  players,
  onAddPlayer,
  onRemovePlayer
}) => {
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldRefocus = useRef(false);

  useEffect(() => {
    if (!isSubmitting && shouldRefocus.current) {
      shouldRefocus.current = false;
      inputRef.current?.focus();
    }
  }, [isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!playerName.trim()) { setError('Player name cannot be empty'); return; }
    setIsSubmitting(true);
    shouldRefocus.current = true;
    try {
      await onAddPlayer(playerName);
      setPlayerName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add player');
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="player-manager">
      <h2>Players</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            ref={inputRef}
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Player name"
            disabled={isSubmitting}
          />
          <button type="submit" disabled={isSubmitting}>Add</button>
        </div>
      </form>
      {error && <div className="error-message">{error}</div>}
      <div className="player-list">
        {players.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-text">No players yet</div>
            <div className="empty-state-hint">Add players above to get started</div>
          </div>
        ) : (
          <ul className="player-grid">
            {players.map((player) => (
              <li key={player.id}>
                <span>{player.name}</span>
                <button
                  className="remove-btn"
                  onClick={() => onRemovePlayer(player.id)}
                  title={`Remove ${player.name}`}
                  aria-label={`Remove ${player.name}`}
                >×</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PlayerManager;
