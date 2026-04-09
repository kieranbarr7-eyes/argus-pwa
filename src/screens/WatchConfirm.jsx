import { useState } from 'react';
import EyeLogo from '../components/EyeLogo';
import { registerWatch } from '../utils/api';
import { subscribeToPush } from '../utils/push';

export default function WatchConfirm({ train, searchParams, onConfirmed, onBack, onChat }) {
  const { trainNumber, routeName, departure, arrival, coachPrice } = train;
  const { origin, destination, date } = searchParams;

  const [threshold, setThreshold] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    setError('');
    setLoading(true);

    try {
      // 1. Request push notification permission
      let subscription = null;
      try {
        const sub = await subscribeToPush();
        subscription = sub?.toJSON?.() || null;
      } catch (err) {
        console.warn('[Argus] Push subscription failed (non-blocking):', err);
      }

      // 2. Register with Railway
      const watchData = {
        origin,
        destination,
        date,
        trains: [{ trainNumber }],
      };

      let watchId = null;
      try {
        const result = await registerWatch(watchData, subscription);
        watchId = result.watch_id;
      } catch (err) {
        console.warn('[Argus] Railway registration failed (continuing locally):', err);
      }

      // 3. Build local watch entry and transition
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
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <EyeLogo size={28} />
        <h1 className="text-white font-bold text-lg">Watch Train</h1>
      </div>

      {/* Train summary */}
      <div className="bg-navy-light rounded-2xl p-5 mb-6 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-electric text-lg">&#x1F4CC;</span>
          <span className="text-white font-bold text-lg">{trainNumber}</span>
          <span className="text-gray-500 text-sm">{routeName}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
          <span>{departure} → {arrival}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-navy rounded-xl px-3 py-2">
            <p className="text-gray-500 text-xs">Route</p>
            <p className="text-white text-sm font-semibold">{origin} → {destination}</p>
          </div>
          <div className="bg-navy rounded-xl px-3 py-2">
            <p className="text-gray-500 text-xs">Current price</p>
            <p className="text-green text-sm font-bold">${coachPrice}</p>
          </div>
        </div>
      </div>

      {/* Threshold input */}
      <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <label className="block text-gray-400 text-xs font-medium mb-2">
          Notify me when price drops below
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">$</span>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder="Leave blank for any drop"
            min="1"
            className="w-full bg-navy-light rounded-xl pl-8 pr-4 py-3 text-white text-sm
                       placeholder-gray-600 outline-none focus:ring-2 focus:ring-electric/50
                       transition-all [appearance:textfield]
                       [&::-webkit-outer-spin-button]:appearance-none
                       [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <p className="text-gray-500 text-xs mt-1.5">
          {threshold && Number(threshold) > 0
            ? `Argus will only notify you when price drops below $${threshold}`
            : 'Argus will notify you every time this train\u2019s price drops'}
        </p>
      </div>

      {/* Argus tip — refundable fare education */}
      <div className="mb-6 bg-electric/10 border border-electric/20 rounded-xl p-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-start gap-2.5">
          <span className="text-lg mt-0.5">💡</span>
          <div>
            <p className="text-white text-sm font-semibold mb-1">Argus tip</p>
            <p className="text-gray-300 text-xs leading-relaxed">
              Book a <span className="text-electric font-medium">Flexible fare</span> now to lock in
              today's price — it's fully refundable up to departure. If the price drops, cancel and
              rebook at the lower price. Argus will watch for drops and notify you.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center mb-4">{error}</p>
      )}

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-green hover:bg-green-dark
                   text-white font-semibold text-base transition-all duration-200
                   active:scale-[0.98] shadow-lg shadow-green/25
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Setting up...
          </span>
        ) : (
          'Start Watching'
        )}
      </button>

      {/* Chat link */}
      <button
        onClick={onChat}
        className="mt-4 w-full text-center text-gray-500 text-xs hover:text-gray-400 transition-colors"
      >
        Need help? Chat with Argus
      </button>
    </div>
  );
}
