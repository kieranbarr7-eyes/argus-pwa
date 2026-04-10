import { useState } from 'react';
import EyeLogo from '../components/EyeLogo';
import { joinWaitlist } from '../utils/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const [email, setEmail] = useState('');
  const [waitlistState, setWaitlistState] = useState('idle'); // idle | loading | success | error
  const [waitlistMessage, setWaitlistMessage] = useState('');

  async function handleWaitlist() {
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setWaitlistState('error');
      setWaitlistMessage('Please enter a valid email');
      return;
    }
    setWaitlistState('loading');
    setWaitlistMessage('');
    try {
      await joinWaitlist(trimmed, 'landing');
      setWaitlistState('success');
      setWaitlistMessage("You're on the list! We'll notify you when alerts launch.");
      setEmail('');
    } catch (err) {
      setWaitlistState('error');
      setWaitlistMessage(err.message || 'Something went wrong. Please try again.');
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero — above the fold */}
      <section className="min-h-[88vh] flex flex-col items-center justify-center px-6 text-center pb-4">
        <div className="animate-fade-in-up max-w-md w-full">
          {/* Logo + wordmark */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <EyeLogo size={40} />
            <span className="text-white font-extrabold text-xl tracking-[0.15em]">
              ARGUS<span className="text-electric">FARE</span>
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.05]">
            Amtrak prices drop.<br />
            <span className="text-electric">Argus tells you when.</span>
          </h1>

          <p className="text-gray-400 text-base mt-5">
            Get notified the moment fares drop on your route.<br />
            <span className="text-gray-500 text-sm">Free to join.</span>
          </p>

          {/* Waitlist signup — PRIMARY CTA */}
          <div style={{ marginTop: '28px' }}>
            <div
              style={{
                display: 'flex',
                gap: '10px',
                maxWidth: '420px',
                margin: '0 auto',
              }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (waitlistState === 'error') {
                    setWaitlistState('idle');
                    setWaitlistMessage('');
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleWaitlist();
                }}
                placeholder="your@email.com"
                disabled={waitlistState === 'loading' || waitlistState === 'success'}
                style={{
                  flex: 1,
                  padding: '16px 18px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'white',
                  fontSize: '16px',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleWaitlist}
                disabled={waitlistState === 'loading' || waitlistState === 'success'}
                style={{
                  padding: '16px 22px',
                  borderRadius: '12px',
                  background: '#3B82F6',
                  border: '1px solid #3B82F6',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: waitlistState === 'loading' ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 10px 25px -10px rgba(59,130,246,0.6)',
                  opacity: waitlistState === 'loading' ? 0.7 : 1,
                  transition: 'transform 0.15s',
                }}
              >
                {waitlistState === 'loading' ? 'Joining…' : 'Notify me'}
              </button>
            </div>
            {waitlistMessage && (
              <p
                style={{
                  marginTop: '12px',
                  fontSize: '13px',
                  color: waitlistState === 'success' ? '#10B981' : '#F87171',
                }}
              >
                {waitlistMessage}
              </p>
            )}
          </div>

          {/* Secondary search link */}
          <button
            onClick={onStart}
            className="mt-5 text-gray-500 hover:text-electric transition-colors text-sm"
          >
            or search trains now →
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
