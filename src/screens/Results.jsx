import TrainCard from '../components/TrainCard';
import EyeLogo from '../components/EyeLogo';

export default function Results({ searchParams, trains, watches, onWatch, onBack }) {
  const { origin, destination, date } = searchParams;
  const hasWatches = watches.length > 0;

  // Format date for display
  const dateDisplay = formatDisplayDate(date);

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <EyeLogo size={24} />
        <div className="flex-1">
          <h1 className="text-white font-bold text-base">
            {origin} → {destination}
          </h1>
          <p className="text-gray-500 text-xs">{dateDisplay}</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-gray-500 text-xs">
          {trains.length} train{trains.length !== 1 ? 's' : ''} found · checked just now
        </span>
        {hasWatches && (
          <span className="flex items-center gap-1.5 text-green text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green pulse-glow" />
            Argus is watching
          </span>
        )}
      </div>

      {/* Train cards */}
      <div className="space-y-3 flex-1">
        {trains.map((train, i) => {
          const isWatched = watches.some((w) => w.trainNumber === train.trainNumber);
          return (
            <div key={train.trainNumber} style={{ animationDelay: `${i * 0.06}s` }}>
              <TrainCard
                train={train}
                searchParams={searchParams}
                isWatched={isWatched}
                onWatch={onWatch}
              />
            </div>
          );
        })}
      </div>

      {trains.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-sm text-center">
            No trains found for this route and date.
          </p>
        </div>
      )}
    </div>
  );
}

function formatDisplayDate(isoDate) {
  if (!isoDate) return '';
  try {
    const d = new Date(isoDate + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return isoDate;
  }
}
