import { useState, useEffect } from 'react';
import Landing from './screens/Landing';
import Search from './screens/Search';
import Results from './screens/Results';
import WatchConfirm from './screens/WatchConfirm';
import Dashboard from './screens/Dashboard';
import Chat from './screens/Chat';

const SCREENS = {
  LANDING: 'landing',
  SEARCH: 'search',
  RESULTS: 'results',
  WATCH_CONFIRM: 'watch_confirm',
  DASHBOARD: 'dashboard',
  CHAT: 'chat',
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.LANDING);
  const [watches, setWatches] = useState([]);         // all active watches
  const [searchParams, setSearchParams] = useState(null); // { origin, destination, date }
  const [trains, setTrains] = useState([]);            // results from search
  const [selectedTrain, setSelectedTrain] = useState(null); // train user is about to watch

  // Restore saved watches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('argus_watches');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWatches(parsed);
          setScreen(SCREENS.DASHBOARD);
        }
      } catch {
        localStorage.removeItem('argus_watches');
      }
    }
  }, []);

  // Persist watches
  useEffect(() => {
    if (watches.length > 0) {
      localStorage.setItem('argus_watches', JSON.stringify(watches));
    }
  }, [watches]);

  // ─── Navigation handlers ──────────────────────────────────────────────────

  const handleSearchTrains = () => setScreen(SCREENS.SEARCH);

  const handleSearchSubmit = (params, trainResults) => {
    setSearchParams(params);
    setTrains(trainResults);
    setScreen(SCREENS.RESULTS);
  };

  const handleWatchTrain = (train) => {
    setSelectedTrain(train);
    setScreen(SCREENS.WATCH_CONFIRM);
  };

  const handleWatchConfirmed = (watchEntry) => {
    setWatches((prev) => {
      // Avoid duplicates
      const exists = prev.some(
        (w) => w.trainNumber === watchEntry.trainNumber && w.origin === watchEntry.origin
      );
      return exists ? prev : [...prev, watchEntry];
    });
    setScreen(SCREENS.DASHBOARD);
  };

  const handleAddAnother = () => {
    setScreen(SCREENS.SEARCH);
  };

  const handleOpenChat = () => setScreen(SCREENS.CHAT);

  const handleChatBack = () => {
    setScreen(watches.length > 0 ? SCREENS.DASHBOARD : SCREENS.LANDING);
  };

  const handleBackToResults = () => {
    if (trains.length > 0) {
      setScreen(SCREENS.RESULTS);
    } else {
      setScreen(SCREENS.SEARCH);
    }
  };

  const handleClearAll = () => {
    setWatches([]);
    localStorage.removeItem('argus_watches');
    setScreen(SCREENS.LANDING);
  };

  const handleRemoveWatch = (trainNumber) => {
    setWatches((prev) => {
      const next = prev.filter((w) => w.trainNumber !== trainNumber);
      if (next.length === 0) localStorage.removeItem('argus_watches');
      return next;
    });
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-navy">
      {screen === SCREENS.LANDING && (
        <Landing onStart={handleSearchTrains} />
      )}
      {screen === SCREENS.SEARCH && (
        <Search
          onResults={handleSearchSubmit}
          onBack={() => setScreen(watches.length > 0 ? SCREENS.DASHBOARD : SCREENS.LANDING)}
        />
      )}
      {screen === SCREENS.RESULTS && (
        <Results
          searchParams={searchParams}
          trains={trains}
          watches={watches}
          onWatch={handleWatchTrain}
          onBack={() => setScreen(SCREENS.SEARCH)}
        />
      )}
      {screen === SCREENS.WATCH_CONFIRM && selectedTrain && (
        <WatchConfirm
          train={selectedTrain}
          searchParams={searchParams}
          onConfirmed={handleWatchConfirmed}
          onBack={handleBackToResults}
          onChat={handleOpenChat}
        />
      )}
      {screen === SCREENS.DASHBOARD && (
        <Dashboard
          watches={watches}
          onAddAnother={handleAddAnother}
          onRemoveWatch={handleRemoveWatch}
          onClear={handleClearAll}
          onChat={handleOpenChat}
        />
      )}
      {screen === SCREENS.CHAT && (
        <Chat onBack={handleChatBack} />
      )}
    </div>
  );
}
