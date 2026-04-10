import EyeLogo from '../components/EyeLogo';

const recentDrops = [
  { train: '651', route: 'NYP → PHL', price: 15, when: '2 hours ago' },
  { train: '179', route: 'NYP → PHL', price: 34, when: 'Today' },
  { train: '125', route: 'NYP → WAS', price: 28, when: 'Yesterday' },
  { train: '66',  route: 'NYP → BOS', price: 45, when: 'Today' },
];

const steps = [
  { icon: '🔍', label: 'Search your route' },
  { icon: '📌', label: 'Pin a train' },
  { icon: '🔔', label: 'Get notified when it drops' },
];

export default function Landing({ onStart }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero — above the fold */}
      <section className="min-h-[88vh] flex flex-col items-center justify-center px-6 text-center pb-4">
        <div className="animate-fade-in-up max-w-md">
          <div className="flex justify-center mb-6">
            <EyeLogo size={64} />
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.05]">
            Amtrak prices drop.<br />
            <span className="text-electric">Argus tells you when.</span>
          </h1>

          <p className="text-gray-400 text-base mt-5">
            Get notified the moment fares drop on your route.
          </p>

          <button
            onClick={onStart}
            className="mt-8 w-full max-w-xs py-4 rounded-xl bg-electric hover:bg-electric-dark
                       text-white font-semibold text-base transition-all duration-200
                       active:scale-[0.98] shadow-lg shadow-electric/25"
          >
            Search Trains →
          </button>

          {/* Scroll indicator */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '24px',
              animation: 'scrollBounce 2s infinite',
            }}
          >
            <span style={{ color: '#4B6CB7', fontSize: '24px' }}>↓</span>
          </div>
        </div>
      </section>

      {/* Recent drops */}
      <section className="px-6 pt-2 pb-10 max-w-2xl mx-auto w-full">
        <h2 className="text-white font-bold text-2xl mb-4">
          Recent drops on popular routes
        </h2>
        <div className="flex gap-3 overflow-x-auto -mx-6 px-6 pb-2 snap-x">
          {recentDrops.map((d) => (
            <div
              key={d.train}
              className="flex-shrink-0 w-56 snap-start bg-navy-light rounded-2xl p-4"
            >
              <div className="text-gray-500 text-xs mb-1">Train {d.train}</div>
              <div className="text-white font-semibold text-sm">{d.route}</div>
              <div className="text-green font-bold text-2xl mt-2">${d.price}</div>
              <div className="text-gray-600 text-xs mt-1">{d.when}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-12 max-w-2xl mx-auto w-full">
        <h2 className="text-white font-bold text-2xl mb-6">How it works</h2>
        <div className="grid grid-cols-3 gap-3">
          {steps.map((s) => (
            <div key={s.label} className="flex flex-col items-center text-center">
              <div className="text-4xl mb-3">{s.icon}</div>
              <div className="text-gray-400 text-xs leading-tight">{s.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
