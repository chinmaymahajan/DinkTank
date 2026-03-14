import React from 'react';

interface RoundNavigatorProps {
  currentRound: number;
  totalRounds: number;
  onNavigate: (roundNumber: number) => void;
}

/**
 * RoundNavigator Component
 * 
 * Displays rounds as clickable tabs for quick navigation.
 * 
 * Requirements: 7.1, 7.3
 */
const RoundNavigator: React.FC<RoundNavigatorProps> = ({
  currentRound,
  totalRounds,
  onNavigate
}) => {
  if (totalRounds === 0) {
    return (
      <div className="round-navigator">
        <p>No rounds available</p>
      </div>
    );
  }

  const roundNumbers = Array.from({ length: totalRounds }, (_, i) => i + 1);

  return (
    <div className="round-navigator">
      <div className="round-tabs">
        {roundNumbers.map((num) => (
          <button
            key={num}
            onClick={() => onNavigate(num)}
            className={`round-tab ${num === currentRound ? 'active' : ''}`}
          >
            Round {num}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoundNavigator;
