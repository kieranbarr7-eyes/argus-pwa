import { useState } from 'react';
import StationInput from '../components/StationInput';
import EyeLogo from '../components/EyeLogo';
import { fetchPrices } from '../utils/api';

export default function Search({ onResults, onBack }) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(getDefaultDate());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSearch = origin && destination && date;

  async function handleSearch() {
    if (!canSearch) return;
    setError('');
    setLoading(true);

    try {
      const trains = await fetchPrices(origin, destination, date);
      onResults({ origin, destination, date }, trains);
    } catch (err) {
      console.error('[Argus] Search failed:', err);
      setError('Could not fetch trains. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <EyeLogo size={28} />
        <h1 className="text-white font-bold text-lg">Search Trains</h1>
      </div>

      {/* Form */}
      <div className="space-y-4 flex-1">
        <StationInput
          label="From"
          placeholder="e.g. NYP, Philadelphia..."
          value={origin}
          onChange={setOrigin}
        />

        {/* Swap button */}
        <div className="flex justify-center -my-1">
          <button
            onClick={() => { setOrigin(destination); setDestination(origin); }}
            className="w-8 h-8 rounded-full bg-navy-light border border-white/10
                       flex items-center justify-center text-gray-500 hover:text-electric
                       transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        <StationInput
          label="To"
          placeholder="e.g. PHL, Washington..."
          value={destination}
          onChange={setDestination}
        />

        <div>
          <label className="block text-gray-400 text-xs font-medium mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-navy-light rounded-xl px-4 py-3 text-white text-sm
                       outline-none focus:ring-2 focus:ring-electric/50 transition-all
                       [color-scheme:dark]"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
      </div>

      {/* Search button */}
      <button
        onClick={handleSearch}
        disabled={!canSearch || loading}
        className="mt-6 w-full py-3.5 rounded-xl bg-electric hover:bg-electric-dark
                   text-white font-semibold text-base transition-all duration-200
                   active:scale-[0.98] shadow-lg shadow-electric/25
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Argus is scanning Amtrak...
          </span>
        ) : (
          'Search'
        )}
      </button>
    </div>
  );
}

function getDefaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1); // default to tomorrow
  return d.toISOString().split('T')[0];
}
