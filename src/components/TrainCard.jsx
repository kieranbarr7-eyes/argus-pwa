import { getPriceIntelligence, isPeakWindow } from '../utils/priceIntel';

/**
 * Train result card showing schedule + prices + price intelligence + actions.
 */
export default function TrainCard({ train, searchParams, isWatched, onWatch }) {
  const { trainNumber, routeName, departure, arrival, duration, coachPrice, bizPrice } = train;
  const { origin, destination, date } = searchParams;

  // Price intelligence
  const peak = isPeakWindow(departure);
  const intel = getPriceIntelligence(origin, destination, routeName, coachPrice, peak);

  // Color temperature for coach price
  const priceColor =
    coachPrice < 50 ? 'text-green' :
    coachPrice <= 80 ? 'text-amber-400' :
    'text-white';

  // Build Amtrak booking URL
  const dateParam = date ? formatDateForAmtrak(date) : '';
  const bookUrl = `https://www.amtrak.com/tickets/departure.html#df=${dateParam}&org=${origin}&dst=${destination}`;

  return (
    <div className="bg-navy-light rounded-2xl p-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-base">{trainNumber}</span>
            <span className="text-gray-500 text-sm">{routeName}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm">
            <span className="text-gray-300">{departure}</span>
            <span className="text-gray-600">&rarr;</span>
            <span className="text-gray-300">{arrival}</span>
            <span className="text-gray-600 text-xs ml-1">({duration})</span>
          </div>
        </div>

        {/* Price */}
        <div className="text-right">
          <div className={`font-bold text-xl ${priceColor}`}>
            ${coachPrice}
          </div>
          <div className="text-gray-600 text-xs">coach</div>
          {bizPrice && (
            <div className="text-gray-500 text-xs mt-0.5">${bizPrice} biz</div>
          )}
        </div>
      </div>

      {/* Price intelligence badge */}
      {intel && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg mb-3 text-xs"
          style={{ backgroundColor: intel.color + '15', color: intel.color }}
        >
          <span>{intel.emoji}</span>
          <span className="font-semibold">{intel.label}</span>
          <span className="opacity-75">&middot;</span>
          <span className="opacity-75">{intel.description}</span>
        </div>
      )}

      {/* Refundable fare tip — show on good and exceptional deals */}
      {intel && (intel.tier === 'exceptional' || intel.tier === 'good') && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg mb-3 text-xs bg-white/5 border border-white/10">
          <span className="mt-0.5">💡</span>
          <span className="text-gray-300">
            <span className="font-semibold text-white">Book the Flexible fare</span> — fully
            refundable up to departure. Lock this price now and cancel free if it drops further.
          </span>
        </div>
      )}

      {/* Actions */}
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
          {isWatched ? 'Watching \u2713' : 'Watch this train \uD83D\uDCCC'}
        </button>

        <a
          href={bookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 rounded-lg bg-white/5 text-gray-400 hover:text-white
                     text-sm font-medium text-center transition-all active:scale-[0.97]"
        >
          Book on Amtrak &rarr;
        </a>
      </div>
    </div>
  );
}

function formatDateForAmtrak(isoDate) {
  const [y, m, d] = isoDate.split('-');
  return `${m}/${d}/${y}`;
}
