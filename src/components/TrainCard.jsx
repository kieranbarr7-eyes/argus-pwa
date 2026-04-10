/**
 * Train result card — minimal, color-coded by price.
 */
export default function TrainCard({ train, searchParams, isWatched, onWatch }) {
  const { trainNumber, routeName, departure, arrival, duration, coachPrice, bizPrice } = train;
  const { origin, destination, date } = searchParams;

  // Color-coded price tiers
  const priceColor = getPriceColor(coachPrice);

  // Build Amtrak booking URL
  const dateParam = date ? formatDateForAmtrak(date) : '';
  const bookUrl = `https://www.amtrak.com/tickets/departure.html#df=${dateParam}&org=${origin}&dst=${destination}`;

  return (
    <div className="bg-navy-light rounded-2xl p-4 animate-fade-in-up">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-base">{trainNumber}</span>
            <span className="text-gray-500 text-xs">{routeName}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm">
            <span className="text-gray-300">{departure}</span>
            <span className="text-gray-600">→</span>
            <span className="text-gray-300">{arrival}</span>
            <span className="text-gray-600 text-xs ml-1">({duration})</span>
          </div>
        </div>

        <div className="text-right">
          <div className="font-bold text-2xl" style={{ color: priceColor }}>
            ${coachPrice}
          </div>
          {bizPrice && (
            <div className="text-gray-500 text-xs mt-0.5">${bizPrice} biz</div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onWatch(train)}
          disabled={isWatched}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.97]
            ${isWatched
              ? 'bg-green/20 text-green cursor-default'
              : 'bg-electric/15 text-electric hover:bg-electric/25'
            }`}
        >
          {isWatched ? 'Watching ✓' : 'Watch 📌'}
        </button>

        <a
          href={bookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 rounded-lg bg-white/5 text-gray-300 hover:text-white
                     text-sm font-medium text-center transition-all active:scale-[0.97]"
        >
          Book →
        </a>
      </div>
    </div>
  );
}

export function getPriceColor(price) {
  if (price == null) return '#FFFFFF';
  if (price < 30) return '#10B981';   // bright green — great deal
  if (price <= 60) return '#34D399';  // light green — good
  if (price <= 90) return '#F59E0B';  // amber — average
  return '#FFFFFF';                   // white — above average
}

function formatDateForAmtrak(isoDate) {
  const [y, m, d] = isoDate.split('-');
  return `${m}/${d}/${y}`;
}
