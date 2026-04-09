import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchHealth, fetchPrices } from '../utils/api';
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

const PRICE_POLL_MS = 90_000;  // re-fetch prices every 90s
const HEALTH_POLL_MS = 60_000; // health check every 60s
const AGO_TICK_MS = 10_000;    // update "Xs ago" every 10s

export default function Dashboard({ watches, onAddAnother, onRemoveWatch, onClear, onChat }) {
  // Server health
  const [health, setHealth] = useState(null);       // { status, active_watches }
  const [healthOk, setHealthOk] = useState(false);

  // Live prices: trainNumber → { price, prevPrice, lastFetchedAt }
  const [liveData, setLiveData] = useState({});
  const [lastFetchAt, setLastFetchAt] = useState(null);

  // Ticking "Xs ago" display
  const [agoText, setAgoText] = useState('');

  // ─── Health check (every 60s) ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const data = await fetchHealth();
        if (!cancelled) {
          setHealth(data);
          setHealthOk(data?.status === 'ok');
        }
      } catch {
        if (!cancelled) { setHealth(null); setHealthOk(false); }
      }
    }
    check();
    const id = setInterval(check, HEALTH_POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // ─── Live price polling (every 90s) ───────────────────────────────────────
  const fetchLatestPrices = useCallback(async () => {
    if (watches.length === 0) return;

    // Group watches by route to avoid duplicate fetches
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

  // ─── "Xs ago" ticker ──────────────────────────────────────────────────────
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

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <EyeLogo size={32} />
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Argus</h1>
            <p className="text-green text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green pulse-glow" />
              Watching {watches.length} train{watches.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="text-right">
          {agoText && (
            <span className="text-gray-500 text-xs">checked {agoText}</span>
          )}
          <button
            onClick={onClear}
            className="block text-gray-600 text-xs hover:text-gray-400 transition-colors mt-0.5"
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Watched trains */}
      <div className="space-y-3 mb-6">
        {watches.map((w, i) => (
          <WatchCard
            key={`${w.trainNumber}-${i}`}
            watch={w}
            live={liveData[w.trainNumber] || null}
            onRemove={() => onRemoveWatch(w.trainNumber)}
          />
        ))}
      </div>

      {/* Savings tracker */}
      <SavingsTracker watches={watches} liveData={liveData} />

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={onAddAnother}
          className="w-full py-3 rounded-xl bg-electric hover:bg-electric-dark
                     text-white font-semibold text-sm transition-all active:scale-[0.98]"
        >
          + Add another train
        </button>

        <button
          onClick={onChat}
          className="w-full py-3 rounded-xl bg-navy-light hover:bg-navy-lighter
                     text-gray-400 font-medium text-sm transition-all active:scale-[0.98]
                     border border-white/10"
        >
          Chat with Argus
        </button>
      </div>

      {/* Server status */}
      <div className="mt-6 bg-navy-light rounded-2xl p-4 animate-fade-in-up">
        <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
          Server
        </h3>
        <div className="grid grid-cols-2 gap-y-1.5 text-sm">
          <span className="text-gray-500">Agent</span>
          <span className="text-right font-medium">
            {healthOk ? (
              <span className="text-green">&#x1F7E2; Online</span>
            ) : health === null ? (
              <span className="text-gray-600">&#x26AA; Connecting...</span>
            ) : (
              <span className="text-red-400">&#x1F534; Offline</span>
            )}
          </span>
          <span className="text-gray-500">Watches</span>
          <span className="text-right text-white font-medium">
            {health?.active_watches ?? '-'}
          </span>
          <span className="text-gray-500">Last check</span>
          <span className="text-right text-white font-medium">
            {lastFetchAt
              ? new Date(lastFetchAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
              : '-'}
          </span>
        </div>
      </div>

      <p className="text-center text-gray-600 text-xs mt-6">
        Argus checks prices every 90 seconds.
      </p>
    </div>
  );
}

// ─── Watch Card ──────────────────────────────────────────────────────────────

function WatchCard({ watch, live, onRemove }) {
  const {
    trainNumber, routeName, origin, destination, date,
    departure, arrival, coachPrice, threshold,
  } = watch;

  // Booking state
  const [booking, setBooking] = useState(() => getBooking(trainNumber));
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingPrice, setBookingPrice] = useState('');

  // Use live price if available, otherwise fall back to the stored price
  const currentPrice = live?.price ?? coachPrice;
  const prevPrice = live?.prevPrice ?? null;

  // Trend arrow — only show if we have a real previous price that differs
  let trendEl = null;
  if (prevPrice !== null && prevPrice !== currentPrice) {
    if (currentPrice < prevPrice) {
      trendEl = <span className="text-green text-sm font-bold" title={`was $${prevPrice}`}>&darr;</span>;
    } else {
      trendEl = <span className="text-red-400 text-sm font-bold" title={`was $${prevPrice}`}>&uarr;</span>;
    }
  } else if (prevPrice !== null && prevPrice === currentPrice) {
    trendEl = <span className="text-gray-500 text-sm">&rarr;</span>;
  }

  // Threshold display
  const hasThreshold = threshold && Number(threshold) > 0 && Number(threshold) < currentPrice;
  const thresholdText = hasThreshold
    ? `notify below $${threshold}`
    : 'notify on any drop';

  // Build Amtrak booking URL
  const dateParam = date ? formatDateForAmtrak(date) : '';
  const bookUrl = `https://www.amtrak.com/tickets/departure.html#df=${dateParam}&org=${origin}&dst=${destination}`;
  const dateDisplay = formatDisplayDate(date);

  // Savings calculation (post-booking)
  const savings = booking ? booking.bookedPrice - currentPrice : 0;
  const hasSavings = booking && savings > 0;

  function handleBookingSubmit() {
    const price = Number(bookingPrice);
    if (!price || price <= 0) return;
    const entry = { bookedPrice: price, bookedAt: Date.now() };
    saveBooking(trainNumber, entry);
    setBooking(entry);
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
            <span className="text-electric text-sm">📌</span>
            <span className="text-white font-bold">{trainNumber}</span>
            <span className="text-gray-500 text-sm">{routeName}</span>
          </div>
          <div className="text-gray-400 text-xs mt-0.5">
            {origin} &rarr; {destination} &middot; {dateDisplay}
          </div>
          <div className="text-gray-500 text-xs mt-0.5">
            {departure} &rarr; {arrival}
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 justify-end">
            {trendEl}
            <span className="text-white font-bold text-lg">${currentPrice}</span>
          </div>
          <div className="text-gray-600 text-xs">{thresholdText}</div>
        </div>
      </div>

      {/* Post-booking: savings opportunity */}
      {booking && (
        <div className={`flex items-center justify-between px-3 py-2 rounded-lg mb-3 text-xs ${
          hasSavings
            ? 'bg-green/10 border border-green/20'
            : 'bg-white/5 border border-white/10'
        }`}>
          <div className="flex items-center gap-2">
            {hasSavings ? (
              <>
                <span>🎉</span>
                <span className="text-green font-semibold">
                  Save ${savings}!
                </span>
                <span className="text-gray-400">
                  Price dropped since you booked (${booking.bookedPrice})
                </span>
              </>
            ) : (
              <>
                <span>✅</span>
                <span className="text-gray-300">
                  Booked at ${booking.bookedPrice}
                </span>
                {savings < 0 && (
                  <span className="text-gray-500">
                    · price went up ${Math.abs(savings)}
                  </span>
                )}
              </>
            )}
          </div>
          <button
            onClick={handleUndoBooking}
            className="text-gray-600 hover:text-gray-400 transition-colors ml-2"
            title="Undo booking"
          >
            ✕
          </button>
        </div>
      )}

      {/* Savings CTA — rebook */}
      {hasSavings && (
        <a
          href={bookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-2 rounded-lg bg-green/20 text-green hover:bg-green/30
                     text-sm font-semibold text-center transition-all active:scale-[0.97] mb-3"
        >
          Rebook &amp; save ${savings} &rarr;
        </a>
      )}

      {/* Refundable fare tip — only show if not yet booked */}
      {!booking && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg mb-3 text-xs bg-white/5 border border-white/10">
          <span className="mt-0.5">💡</span>
          <span className="text-gray-400">
            Book a <span className="text-white font-medium">Flexible fare</span> — fully
            refundable. If it drops, cancel &amp; rebook.
          </span>
        </div>
      )}

      {/* Inline booking form */}
      {showBookingForm && (
        <div className="flex gap-2 mb-3 animate-fade-in-up">
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
                         transition-all [appearance:textfield]
                         [&::-webkit-outer-spin-button]:appearance-none
                         [&::-webkit-inner-spin-button]:appearance-none"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleBookingSubmit()}
            />
          </div>
          <button
            onClick={handleBookingSubmit}
            className="px-3 py-2 rounded-lg bg-green/20 text-green text-sm font-medium
                       hover:bg-green/30 transition-all active:scale-[0.97]"
          >
            Save
          </button>
          <button
            onClick={() => { setShowBookingForm(false); setBookingPrice(''); }}
            className="px-2 py-2 rounded-lg bg-white/5 text-gray-500 text-sm
                       hover:text-gray-400 transition-all active:scale-[0.97]"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex gap-2 mt-3">
        {!booking && !showBookingForm && (
          <button
            onClick={() => setShowBookingForm(true)}
            className="flex-1 py-2 rounded-lg bg-green/15 text-green hover:bg-green/25
                       text-sm font-medium text-center transition-all active:scale-[0.97]"
          >
            I booked it ✓
          </button>
        )}
        <a
          href={bookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 rounded-lg bg-electric/15 text-electric hover:bg-electric/25
                     text-sm font-medium text-center transition-all active:scale-[0.97]"
        >
          {booking ? 'View on Amtrak' : 'Book Now'}
        </a>
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

// ─── Savings Tracker ────────────────────────────────────────────────────────

function SavingsTracker({ watches, liveData }) {
  const stats = useMemo(() => {
    let totalSavings = 0;
    let bookingCount = 0;
    let savingsCount = 0;

    for (const w of watches) {
      const booking = getBooking(w.trainNumber);
      if (!booking) continue;
      bookingCount++;
      const currentPrice = liveData[w.trainNumber]?.price ?? w.coachPrice;
      const diff = booking.bookedPrice - currentPrice;
      if (diff > 0) {
        totalSavings += diff;
        savingsCount++;
      }
    }

    return { totalSavings, bookingCount, savingsCount };
  }, [watches, liveData]);

  if (stats.bookingCount === 0) return null;

  return (
    <div className="bg-navy-light rounded-2xl p-4 mb-6 animate-fade-in-up">
      <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
        Savings Tracker
      </h3>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className={`text-xl font-bold ${stats.totalSavings > 0 ? 'text-green' : 'text-gray-400'}`}>
            ${stats.totalSavings}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">potential savings</p>
        </div>
        <div>
          <p className="text-xl font-bold text-white">{stats.bookingCount}</p>
          <p className="text-gray-500 text-xs mt-0.5">booked</p>
        </div>
        <div>
          <p className="text-xl font-bold text-electric">{stats.savingsCount}</p>
          <p className="text-gray-500 text-xs mt-0.5">with drops</p>
        </div>
      </div>
      {stats.totalSavings > 0 && (
        <p className="text-green text-xs text-center mt-3">
          🎉 You could save ${stats.totalSavings} by rebooking at today's prices!
        </p>
      )}
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
