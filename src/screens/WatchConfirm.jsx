import { useState } from 'react';
import EyeLogo from '../components/EyeLogo';
import { registerWatch } from '../utils/api';
import { subscribeToPush } from '../utils/push';

export default function WatchConfirm({ train, searchParams, onConfirmed, onBack, onChat }) {
  const { trainNumber, routeName, departure, arrival, coachPrice } = train;
  const { origin, destination, date } = searchParams;

  const [threshold, setThreshold] = useState('');
  const [showThreshold, setShowThreshold] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    setError('');
    setLoading(true);

    try {
      let subscription = null;
      try {
        const sub = await subscribeToPush();
        subscription = sub?.toJSON?.() || null;
      } catch (err) {
        console.warn('[Argus] Push subscription failed (non-blocking):', err);
      }

      const watchData = { origin, destination, date, trains: [{ trainNumber }] };

      let watchId = null;
      try {
        const result = await registerWatch(watchData, subscription);
        watchId = result.watch_id;
      } catch (err) {
        console.warn('[Argus] Railway registration failed (continuing locally):', err);
      }

      const watchEntry = {
        trainNumber,
        routeName,
        origin,
        destination,
        date,
        departure,
        arrival,
        coachPrice,
        threshold: threshold && Number(threshold) > 0 ? Number(threshold) : null,
        watchId,
        createdAt: Date.now(),
      };

      onConfirmed(watchEntry);
    } catch (err) {
      console.error('[Argus] Watch confirmation failed:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <EyeLogo size={24} />
        <h1 className="text-white font-bold text-lg">Watch Train</h1>
      </div>

      {/* Train summary */}
      <div className="bg-navy-light rounded-2xl p-5 mb-5 animate-fade-in-up">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg">{trainNumber}</span>
              <span className="text-gray-500 text-xs">{routeName}</span>
            </div>
            <div className="text-gray-400 text-sm mt-1">
              {departure} → {arrival}
            </div>
            <div className="text-gray-500 text-xs mt-0.5">
              {origin} → {destination}
            </div>
          </div>
          <div className="text-green font-bold text-2xl">${coachPrice}</div>
        </div>
      </div>

      {/* One-line tip */}
      <p className="text-gray-400 text-xs mb-5 px-1">
        💡 Book the Flexible fare on Amtrak — fully refundable if it drops again.
      </p>

      {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full py-4 rounded-xl bg-green hover:bg-green-dark
                   text-white font-bold text-base transition-all duration-200
                   active:scale-[0.98] shadow-lg shadow-green/25
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Setting up…' : 'Start Watching'}
      </button>

      {/* Expandable target */}
      <div className="mt-4">
        {!showThreshold ? (
          <button
            onClick={() => setShowThreshold(true)}
            className="w-full text-center text-gray-500 text-xs hover:text-gray-300 transition-colors"
          >
            Set a price target
          </button>
        ) : (
          <div className="animate-fade-in-up">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="Notify below…"
                min="1"
                className="w-full bg-navy-light rounded-xl pl-8 pr-4 py-3 text-white text-sm
                           placeholder-gray-600 outline-none focus:ring-2 focus:ring-electric/50
                           [appearance:textfield]
                           [&::-webkit-outer-spin-button]:appearance-none
                           [&::-webkit-inner-spin-button]:appearance-none"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>

      {/* Chat link */}
      <button
        onClick={onChat}
        className="mt-6 w-full text-center text-gray-600 text-xs hover:text-gray-400 transition-colors"
      >
        Need help? Chat with Argus
      </button>
    </div>
  );
}
