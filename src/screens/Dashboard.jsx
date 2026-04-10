import { useState, useEffect, useCallback } from 'react';
import { fetchPrices } from '../utils/api';
import { getPriceColor } from '../components/TrainCard';
import EyeLogo from '../components/EyeLogo';

// ─── Booking helpers ────────────────────────────────────────────────────────
function getBooking(trainNumber) {
  try {
    const raw = localStorage.getItem(`argus_booked_${trainNumber}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveBooking(trainNumber, data) {
  localStorage.setItem(`argus_booked_${trainNumber}`, JSON.stringify(data));
}

function removeBooking(trainNumber) {
  localStorage.removeItem(`argus_booked_${trainNumber}`);
}

const PRICE_POLL_MS = 90_000;
const AGO_TICK_MS = 10_000;

export default function Dashboard({ watches, onAddAnother, onRemoveWatch, onClear, onChat }) {
  const [liveData, setLiveData] = useState({});
  const [lastFetchAt, setLastFetchAt] = useState(null);
  const [agoText, setAgoText] = useState('');

  // Live price polling
  const fetchLatestPrices = useCallback(async () => {
    if (watches.length === 0) return;
    const routes = new Map();
    for (const w of watches) {
      const key = `${w.origin}-${w.destination}-${w.date}`;
      if (!routes.has(key)) routes.set(key, w);
    }
    for (const w of routes.values()) {
      try {
        const trains = await fetchPrices(w.origin, w.destination, w.date);
        setLiveData((prev) => {
          const next = { ...prev };
          for (const t of trains) {
            const old = next[t.trainNumber];
            next[t.trainNumber] = {
              price: t.coachPrice,
              prevPrice: old?.price ?? null,
              lastFetchedAt: Date.now(),
            };
          }
          return next;
        });
        setLastFetchAt(Date.now());
      } catch (err) {
        console.warn('[Argus] Price refresh failed:', err);
      }
    }
  }, [watches]);

  useEffect(() => {
    fetchLatestPrices();
    const id = setInterval(fetchLatestPrices, PRICE_POLL_MS);
    return () => clearInterval(id);
  }, [fetchLatestPrices]);

  // "Xs ago" ticker
  useEffect(() => {
    function tick() {
      if (!lastFetchAt) { setAgoText(''); return; }
      const secs = Math.round((Date.now() - lastFetchAt) / 1000);
      if (secs < 5) setAgoText('just now');
      else if (secs < 60) setAgoText(`${secs}s ago`);
      else setAgoText(`${Math.floor(secs / 60)}m ago`);
    }
    tick();
    const id = setInterval(tick, AGO_TICK_MS);
    return () => clearInterval(id);
  }, [lastFetchAt]);

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <EyeLogo size={28} />
          <h1 className="text-white font-bold text-xl">
            Watching {watches.length}
          </h1>
        </div>
        <button
          onClick={onClear}
          className="text-gray-600 text-xs hover:text-gray-400 transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* Watched trains */}
      <div className="space-y-3 mb-5">
        {watches.map((w, i) => (
          <WatchCard
            key={`${w.trainNumber}-${i}`}
            watch={w}
            live={liveData[w.trainNumber] || null}
            onRemove={() => onRemoveWatch(w.trainNumber)}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={onAddAnother}
          className="w-full py-3 rounded-xl bg-electric hover:bg-electric-dark
                     text-white font-semibold text-sm transition-all active:scale-[0.98]"
        >
          + Add another train
        </button>
        <button
          onClick={onChat}
          className="w-full py-2.5 rounded-xl text-gray-500 font-medium text-xs
                     hover:text-gray-300 transition-all"
        >
          Chat with Argus
        </button>
      </div>

      {/* Subtle status line */}
      <p className="text-center text-gray-600 text-[11px] mt-6">
        Argus is watching{agoText && ` · last checked ${agoText}`}
      </p>
    </div>
  );
}

// ─── Watch Card ──────────────────────────────────────────────────────────────

function WatchCard({ watch, live, onRemove }) {
  const {
    trainNumber, routeName, origin, destination, date,
    departure, arrival, coachPrice,
  } = watch;

  const [booking, setBooking] = useState(() => getBooking(trainNumber));
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingPrice, setBookingPrice] = useState('');

  const currentPrice = live?.price ?? coachPrice;
  const priceColor = getPriceColor(currentPrice);

  // Initial watch price → drop amount
  const dropFromStart = coachPrice - currentPrice;
  const hasDropped = dropFromStart > 0;

  const dateParam = date ? formatDateForAmtrak(date) : '';
  const bookUrl = `https://www.amtrak.com/tickets/departure.html#df=${dateParam}&org=${origin}&dst=${destination}`;
  const dateDisplay = formatDisplayDate(date);

  const savings = booking ? booking.bookedPrice - currentPrice : 0;
  const hasSavings = booking && savings > 0;

  function handleBookingSubmit() {
    const price = Number(bookingPrice);
    if (!price || price <= 0) return;
    saveBooking(trainNumber, { bookedPrice: price, bookedAt: Date.now() });
    setBooking({ bookedPrice: price, bookedAt: Date.now() });
    setShowBookingForm(false);
    setBookingPrice('');
  }

  function handleUndoBooking() {
    removeBooking(trainNumber);
    setBooking(null);
  }

  return (
    <div className="bg-navy-light rounded-2xl p-4 animate-fade-in-up">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">{trainNumber}</span>
            <span className="text-gray-500 text-xs">{routeName}</span>
          </div>
          <div className="text-gray-400 text-xs mt-0.5">
            {origin} → {destination} · {dateDisplay}
          </div>
          <div className="text-gray-500 text-xs">
            {departure} → {arrival}
          </div>
        </div>

        <div className="text-right">
          <div className="font-bold text-2xl" style={{ color: priceColor }}>
            ${currentPrice}
          </div>
          {hasDropped && (
            <div className="text-green text-xs font-semibold">↓ dropped ${dropFromStart}</div>
          )}
        </div>
      </div>

      {/* Booked indicator */}
      {booking && (
        <div className={`flex items-center justify-between px-3 py-2 rounded-lg mt-3 text-xs ${
          hasSavings ? 'bg-green/10 border border-green/20' : 'bg-white/5 border border-white/10'
        }`}>
          <span className={hasSavings ? 'text-green font-semibold' : 'text-gray-400'}>
            {hasSavings
              ? `🎉 Save $${savings} · booked at $${booking.bookedPrice}`
              : `✅ Booked at $${booking.bookedPrice}`}
          </span>
          <button
            onClick={handleUndoBooking}
            className="text-gray-600 hover:text-gray-400 ml-2"
            title="Undo booking"
          >
            ✕
          </button>
        </div>
      )}

      {/* Inline booking form */}
      {showBookingForm && (
        <div className="flex gap-2 mt-3 animate-fade-in-up">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input
              type="number"
              value={bookingPrice}
              onChange={(e) => setBookingPrice(e.target.value)}
              placeholder={String(currentPrice)}
              min="1"
              className="w-full bg-navy rounded-lg pl-7 pr-3 py-2 text-white text-sm
                         placeholder-gray-600 outline-none focus:ring-2 focus:ring-green/50
                         [appearance:textfield]
                         [&::-webkit-outer-spin-button]:appearance-none
                         [&::-webkit-inner-spin-button]:appearance-none"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleBookingSubmit()}
            />
          </div>
          <button
            onClick={handleBookingSubmit}
            className="px-3 py-2 rounded-lg bg-green/20 text-green text-sm font-medium"
          >
            Save
          </button>
          <button
            onClick={() => { setShowBookingForm(false); setBookingPrice(''); }}
            className="px-2 py-2 rounded-lg bg-white/5 text-gray-500 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <a
          href={bookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 rounded-lg bg-electric/15 text-electric hover:bg-electric/25
                     text-sm font-semibold text-center transition-all active:scale-[0.97]"
        >
          Book Now →
        </a>
        {!booking && !showBookingForm && (
          <button
            onClick={() => setShowBookingForm(true)}
            className="flex-1 transition-all active:scale-[0.97]"
            style={{
              background: 'transparent',
              border: '1px solid #10B981',
              color: '#10B981',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            I booked it
          </button>
        )}
        <button
          onClick={onRemove}
          className="py-2 px-3 rounded-lg bg-white/5 text-gray-500 hover:text-red-400
                     text-sm transition-all active:scale-[0.97]"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function formatDateForAmtrak(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${m}/${d}/${y}`;
}

function formatDisplayDate(isoDate) {
  if (!isoDate) return '';
  try {
    const d = new Date(isoDate + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return isoDate;
  }
}
