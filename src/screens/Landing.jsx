import EyeLogo from '../components/EyeLogo';

const steps = [
  {
    icon: '1',
    title: 'Tell Argus your route',
    desc: 'Search for trains on any Amtrak route and date.',
  },
  {
    icon: '2',
    title: 'Argus watches prices 24/7',
    desc: 'Our server checks Amtrak fares every 90 seconds around the clock.',
  },
  {
    icon: '3',
    title: 'Get notified when fares drop',
    desc: 'Instant push notifications the moment a price drops into your range.',
  },
];

export default function Landing({ onStart }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Hero */}
      <div className="animate-fade-in-up text-center max-w-md">
        <div className="flex justify-center mb-6">
          <EyeLogo size={72} />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight mb-1">
          <span className="text-electric">ARGUS</span>
          <span className="text-white">FARE</span>
        </h1>

        <p className="text-gray-400 text-base mt-3 leading-relaxed">
          Argus never blinks.<br />
          Get notified when Amtrak prices drop.
        </p>
      </div>

      {/* Steps */}
      <div className="mt-10 w-full max-w-sm space-y-4">
        {steps.map((step) => (
          <div
            key={step.icon}
            className="flex items-start gap-4 animate-fade-in-up"
            style={{ animationDelay: `${parseInt(step.icon) * 0.12}s` }}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-electric/20 text-electric font-bold text-sm flex items-center justify-center">
              {step.icon}
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">{step.title}</h3>
              <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={onStart}
        className="mt-10 w-full max-w-sm py-3.5 rounded-xl bg-electric hover:bg-electric-dark
                   text-white font-semibold text-base transition-all duration-200
                   active:scale-[0.98] shadow-lg shadow-electric/25"
      >
        Search Trains
      </button>

      <p className="mt-4 text-gray-600 text-xs">
        Free forever. No account required.
      </p>
    </div>
  );
}
