import { useState, useEffect } from 'react';
import './App.css';
import {
  LeagueSelector,
  PlayerManager,
  CourtManager,
  RoundDisplay,
  RoundNavigator,
  RoundGenerator,
  DevTools
} from './components';
import { api } from './api/client';
import { League, Player, Court, Round, Assignment, LeagueFormat } from './types';

function App() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => { loadLeagues(); }, []);

  useEffect(() => {
    if (selectedLeagueId) loadLeagueData(selectedLeagueId);
  }, [selectedLeagueId]);

  useEffect(() => {
    if (currentRound) loadAssignments(currentRound.id);
  }, [currentRound]);

  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  const selectedLeague = leagues.find(l => l.id === selectedLeagueId);

  const loadLeagues = async () => {
    try { setLeagues(await api.listLeagues()); }
    catch (err: any) { setError(err.message || 'Failed to load leagues'); }
  };

  const loadLeagueData = async (leagueId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [playersData, courtsData, roundsData] = await Promise.all([
        api.getPlayers(leagueId),
        api.getCourts(leagueId),
        api.listRounds(leagueId)
      ]);
      setPlayers(playersData);
      setCourts(courtsData);
      setRounds(roundsData);
      if (roundsData.length > 0) {
        setCurrentRound(roundsData[roundsData.length - 1]);
      } else {
        setCurrentRound(null);
        setAssignments([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load league data');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async (roundId: string) => {
    try { setAssignments(await api.getAssignments(roundId)); }
    catch (err: any) { setError(err.message || 'Failed to load assignments'); }
  };

  const handleSelectLeague = async (leagueId: string) => {
    setError(null);
    setSuccessMessage(null);
    if (!leagueId) {
      setSelectedLeagueId(null);
      setPlayers([]);
      setCourts([]);
      setRounds([]);
      setCurrentRound(null);
      setAssignments([]);
      return;
    }
    try {
      await api.selectLeague(leagueId);
      setSelectedLeagueId(leagueId);
      setSuccessMessage('League selected');
    } catch (err: any) { setError(err.message || 'Failed to select league'); }
  };

  const handleCreateLeague = async (name: string, format: LeagueFormat) => {
    setError(null);
    setSuccessMessage(null);
    try {
      const league = await api.createLeague(name, format);
      setLeagues([...leagues, league]);
      setSuccessMessage(`League "${name}" created`);
      setSelectedLeagueId(league.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create league');
      throw err;
    }
  };

  const handleAddPlayer = async (name: string) => {
    if (!selectedLeagueId) return;
    setError(null);
    setSuccessMessage(null);
    try {
      const player = await api.addPlayer(selectedLeagueId, name);
      setPlayers([...players, player]);
      setSuccessMessage(`${name} added`);
    } catch (err: any) {
      setError(err.message || 'Failed to add player');
      throw err;
    }
  };

  const handleAddCourt = async (identifier: string) => {
    if (!selectedLeagueId) return;
    setError(null);
    setSuccessMessage(null);
    try {
      const court = await api.addCourt(selectedLeagueId, identifier);
      setCourts([...courts, court]);
      setSuccessMessage(`${identifier} added`);
    } catch (err: any) {
      setError(err.message || 'Failed to add court');
      throw err;
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    setError(null);
    try {
      await api.deletePlayer(playerId);
      setPlayers(players.filter(p => p.id !== playerId));
      setSuccessMessage('Player removed');
    } catch (err: any) { setError(err.message || 'Failed to remove player'); }
  };

  const handleRemoveCourt = async (courtId: string) => {
    setError(null);
    try {
      await api.deleteCourt(courtId);
      setCourts(courts.filter(c => c.id !== courtId));
      setSuccessMessage('Court removed');
    } catch (err: any) { setError(err.message || 'Failed to remove court'); }
  };

  const handleGenerateRound = async () => {
    if (!selectedLeagueId) return;
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const round = await api.generateRound(selectedLeagueId);
      setRounds([...rounds, round]);
      setCurrentRound(round);
      setSuccessMessage(`Round ${round.roundNumber} generated`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate round');
      throw err;
    } finally { setLoading(false); }
  };

  const handleNavigateToRound = (roundNumber: number) => {
    const round = rounds.find(r => r.roundNumber === roundNumber);
    if (round) setCurrentRound(round);
  };

  const handleUpdateAssignments = async (updates: Array<{
    courtId: string;
    team1PlayerIds: string[];
    team2PlayerIds: string[];
  }>) => {
    if (!currentRound) return;
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const updatedAssignments = await api.updateAssignments(currentRound.id, updates);
      setAssignments(updatedAssignments);
      setSuccessMessage('Assignments saved');
    } catch (err: any) {
      setError(err.message || 'Failed to update assignments');
      throw err;
    } finally { setLoading(false); }
  };

  const handleSeedMockData = async () => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const data = await api.seedMockData();
      await loadLeagues();
      setSelectedLeagueId(data.league.id);
      setSuccessMessage(`Mock data created: ${data.players} players, ${data.courts} courts`);
    } catch (err: any) { setError(err.message || 'Failed to seed mock data'); }
    finally { setLoading(false); }
  };

  const handleClearAllData = async () => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      await api.clearAllData();
      setLeagues([]);
      setSelectedLeagueId(null);
      setPlayers([]);
      setCourts([]);
      setRounds([]);
      setCurrentRound(null);
      setAssignments([]);
      setSuccessMessage('All data cleared');
    } catch (err: any) { setError(err.message || 'Failed to clear data'); }
    finally { setLoading(false); }
  };

  const formatLabel = (f: string) => f === 'round_robin' ? 'Round Robin' : f;

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <header>
        <h1>🏓 DinkTank</h1>
        <button
          className="theme-toggle"
          onClick={() => setDarkMode(!darkMode)}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </header>

      {selectedLeague && (
        <div className="context-bar">
          <div className="context-item">
            <span className="context-label">League</span>
            <span className="context-value">{selectedLeague.name}</span>
          </div>
          <div className="context-item">
            <span className="context-label">Format</span>
            <span className="context-value">{formatLabel(selectedLeague.format)}</span>
          </div>
          <div className="context-item">
            <span className="context-label">Players</span>
            <span className="context-value">{players.length}</span>
          </div>
          <div className="context-item">
            <span className="context-label">Courts</span>
            <span className="context-value">{courts.length}</span>
          </div>
          <div className="context-item">
            <span className="context-label">Rounds</span>
            <span className="context-value">{rounds.length}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)} className="dismiss-button">×</button>
        </div>
      )}

      {successMessage && (
        <div className="success-banner">
          {successMessage}
          <button onClick={() => setSuccessMessage(null)} className="dismiss-button">×</button>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <span>Loading...</span>
          </div>
        </div>
      )}

      <main>
        <DevTools
          onSeedData={handleSeedMockData}
          onClearData={handleClearAllData}
        />

        <section className="league-section">
          <LeagueSelector
            leagues={leagues}
            selectedLeagueId={selectedLeagueId}
            onSelect={handleSelectLeague}
            onCreateLeague={handleCreateLeague}
          />
        </section>

        {selectedLeagueId && (
          <>
            <div className="management-section">
              <PlayerManager
                leagueId={selectedLeagueId}
                players={players}
                onAddPlayer={handleAddPlayer}
                onRemovePlayer={handleRemovePlayer}
              />
              <CourtManager
                leagueId={selectedLeagueId}
                courts={courts}
                onAddCourt={handleAddCourt}
                onRemoveCourt={handleRemoveCourt}
              />
            </div>

            <section className="rounds-section">
              <RoundGenerator
                leagueId={selectedLeagueId}
                onGenerateRound={handleGenerateRound}
              />
              
              {rounds.length > 0 && currentRound && (
                <>
                  <RoundNavigator
                    currentRound={currentRound.roundNumber}
                    totalRounds={rounds.length}
                    onNavigate={handleNavigateToRound}
                  />
                  <RoundDisplay
                    round={currentRound}
                    assignments={assignments}
                    courts={courts}
                    players={players}
                    onUpdateAssignments={handleUpdateAssignments}
                  />
                </>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
