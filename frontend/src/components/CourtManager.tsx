import React, { useState } from 'react';
import { Court } from '../types';

interface CourtManagerProps {
  leagueId: string;
  courts: Court[];
  onAddCourt: (identifier: string) => Promise<void>;
}

/**
 * CourtManager Component
 * 
 * Displays the list of courts in the league and provides a form to add new courts.
 * Includes validation for court identifiers and displays validation errors.
 * 
 * Requirements: 2.1, 2.3, 2.4
 */
const CourtManager: React.FC<CourtManagerProps> = ({
  courts,
  onAddCourt
}) => {
  const [courtIdentifier, setCourtIdentifier] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!courtIdentifier.trim()) {
      setError('Court number cannot be empty');
      return;
    }

    if (isNaN(Number(courtIdentifier))) {
      setError('Please enter a number');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddCourt(`Court ${courtIdentifier.trim()}`);
      setCourtIdentifier('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add court');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="court-manager">
      <h2>Courts</h2>
      
      <form onSubmit={handleSubmit} className="add-court-form">
        <input
          type="number"
          value={courtIdentifier}
          onChange={(e) => setCourtIdentifier(e.target.value)}
          placeholder="Type court number and press Enter"
          disabled={isSubmitting}
          className="court-input"
          min="1"
        />
      </form>

      {error && <div className="error-message">{error}</div>}

      <div className="court-list">
        {courts.length === 0 ? (
          <p>No courts added yet</p>
        ) : (
          <ul>
            {courts.map((court) => (
              <li key={court.id}>{court.identifier}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CourtManager;
