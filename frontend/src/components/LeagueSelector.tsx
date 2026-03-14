import React, { useState } from 'react';
import { League, LeagueFormat } from '../types';
import FormatSelector from './FormatSelector';

interface LeagueSelectorProps {
  leagues: League[];
  selectedLeagueId: string | null;
  onSelect: (leagueId: string) => void;
  onCreateLeague?: (name: string, format: LeagueFormat) => Promise<void>;
  /** When true, renders as compact session switcher (for Setup tab) */
  compact?: boolean;
}

const formatLabel = (f: string) => f === 'round_robin' ? 'Round Robin' : f;

const timeAgo = (date: Date) => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString();
};

const LeagueSelector: React.FC<LeagueSelectorProps> = ({
  leagues,
  selectedLeagueId,
  onSelect,
  onCreateLeague,
  compact = false
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [leagueName, setLeagueName] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<LeagueFormat>(LeagueFormat.ROUND_ROBIN);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!leagueName.trim()) { setError('Session name cannot be empty'); return; }
    if (!onCreateLeague) return;
    setIsSubmitting(true);
    try {
      await onCreateLeague(leagueName, selectedFormat);
      setLeagueName('');
      setSelectedFormat(LeagueFormat.ROUND_ROBIN);
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally { setIsSubmitting(false); }
  };

  const createForm = (
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
        placeholder="Session name (e.g. Tuesday Ladder)"
        disabled={isSubmitting}
        autoFocus
      />
      <div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create'}
        </button>
        <button
          type="button"
          onClick={() => { setShowCreateForm(false); setLeagueName(''); setError(null); }}
          disabled={isSubmitting}
        >Cancel</button>
      </div>
      {error && <div className="error-message">{error}</div>}
    </form>
  );

  // --- Compact mode: simple dropdown for Setup tab ---
  if (compact) {
    return (
      <div className="league-selector">
        <h2>Session</h2>
        <select
          value={selectedLeagueId || ''}
          onChange={(e) => onSelect(e.target.value)}
          className="league-select"
        >
          <option value="">-- Switch Session --</option>
          {leagues.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} ({formatLabel(l.format)})
            </option>
          ))}
        </select>
      </div>
    );
  }

  // --- Landing page mode ---
  // No sessions exist
  if (leagues.length === 0) {
    return (
      <div className="landing-page">
        <div className="landing-hero">
          <div className="landing-icon">🏓</div>
          <h1>Welcome to DinkTank</h1>
          <p className="landing-subtitle">
            Run pickleball leagues, ladders and open play in seconds.
          </p>
        </div>
        {showCreateForm ? createForm : (
          <button
            onClick={() => setShowCreateForm(true)}
            className="landing-cta"
          >
            Start New Session
          </button>
        )}
      </div>
    );
  }

  // Sessions exist
  return (
    <div className="landing-page">
      <h2 className="landing-sessions-title">Your Sessions</h2>
      <div className="session-list">
        {leagues.map((league) => (
          <div
            key={league.id}
            className={`session-card ${selectedLeagueId === league.id ? 'active' : ''}`}
          >
            <div className="session-card-info">
              <span className="session-card-name">{league.name}</span>
              <span className="session-card-meta">
                {formatLabel(league.format)} · Updated {timeAgo(league.updatedAt)}
              </span>
            </div>
            <button
              className="session-card-btn"
              onClick={() => onSelect(league.id)}
            >
              Resume
            </button>
          </div>
        ))}
      </div>
      <div className="landing-new-session">
        {showCreateForm ? createForm : (
          <button
            onClick={() => setShowCreateForm(true)}
            className="landing-new-btn"
          >
            + New Session
          </button>
        )}
      </div>
    </div>
  );
};

export default LeagueSelector;
