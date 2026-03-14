import React from 'react';
import { LeagueFormat } from '../types';

interface FormatSelectorProps {
  selectedFormat: LeagueFormat;
  onSelect: (format: LeagueFormat) => void;
  disabled?: boolean;
}

/**
 * FormatSelector Component
 * 
 * Allows users to select a league format before creating a league.
 * Currently supports Round Robin with placeholders for future formats.
 */
const FormatSelector: React.FC<FormatSelectorProps> = ({
  selectedFormat,
  onSelect,
  disabled = false
}) => {
  const formatOptions = [
    {
      value: LeagueFormat.ROUND_ROBIN,
      label: 'Round Robin',
      description: 'Every player plays with and against every other player'
    },
    // Future formats can be uncommented when implemented
    // {
    //   value: LeagueFormat.SINGLE_ELIMINATION,
    //   label: 'Single Elimination',
    //   description: 'Tournament bracket where losers are eliminated'
    // },
    // {
    //   value: LeagueFormat.DOUBLE_ELIMINATION,
    //   label: 'Double Elimination',
    //   description: 'Tournament bracket with a losers bracket'
    // }
  ];

  return (
    <div className="format-selector">
      <label htmlFor="format-select">League Format:</label>
      <select
        id="format-select"
        value={selectedFormat}
        onChange={(e) => onSelect(e.target.value as LeagueFormat)}
        disabled={disabled}
        className="format-select"
      >
        {formatOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="format-description">
        {formatOptions.find(opt => opt.value === selectedFormat)?.description}
      </p>
    </div>
  );
};

export default FormatSelector;
