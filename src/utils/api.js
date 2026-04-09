const RAILWAY_URL = import.meta.env.VITE_RAILWAY_URL || 'https://argus-agent-production.up.railway.app';
const ARGUS_SECRET = import.meta.env.VITE_ARGUS_SECRET || '';

// ─── Mock data (used until /prices endpoint is built on Railway) ─────────

const MOCK_TRAINS = [
  { trainNumber: '179', routeName: 'Northeast Regional', departure: '7:05 AM', arrival: '8:35 AM', duration: '1h 30m', coachPrice: 34, bizPrice: 96 },
  { trainNumber: '111', routeName: 'Northeast Regional', departure: '9:05 AM', arrival: '10:35 AM', duration: '1h 30m', coachPrice: 68, bizPrice: 96 },
  { trainNumber: '89', routeName: 'Palmetto', departure: '3:05 PM', arrival: '4:35 PM', duration: '1h 30m', coachPrice: 95, bizPrice: 137 },
  { trainNumber: '651', routeName: 'Keystone Service', departure: '1:05 PM', arrival: '2:45 PM', duration: '1h 40m', coachPrice: 15, bizPrice: null },
];

// ─── Common headers ─────────────────────────────────────────────────────────

function jsonHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (ARGUS_SECRET) {
    headers['X-Argus-Secret'] = ARGUS_SECRET;
  }
  return headers;
}

// ─── Claude chat (proxied through Railway — API key stays server-side) ────

/**
 * Build a system prompt that includes the user's current watched trains.
 */
export function buildSystemPrompt(watchContext = '') {
  return `You are Argus, a friendly AI assistant that helps users monitor Amtrak ticket prices.

Current user context:
${watchContext || 'The user is not currently watching any trains.'}

You have full knowledge of what trains the user is watching. If they ask about their watched trains, remind them clearly. Do not ask them to start over or re-enter information you already have.

If the user wants to add a new watch, help them through it conversationally. If they ask about current prices or their existing watches, answer based on the context above.

Common station codes: NYP = New York Penn, PHL = Philadelphia, WAS = Washington DC, BOS = Boston, BAL = Baltimore, NWK = Newark, WIL = Wilmington, PVD = Providence, NHV = New Haven, STM = Stamford, TRE = Trenton, ALB = Albany, CHI = Chicago.

Ask one question at a time. Be conversational and brief — no more than 2-3 sentences per message. If the user is setting up a new watch, once you have origin, destination, timing, and budget, confirm and end your final message with the JSON on a new line:
WATCH_DATA: {"origin": "NYP", "destination": "PHL", "timeStart": "14:00", "timeEnd": "19:00", "budgetMin": 40, "budgetMax": 60}`;
}

/**
 * Build watch context string from localStorage watches.
 */
export function getWatchContext() {
  try {
    const raw = localStorage.getItem('argus_watches');
    const watches = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(watches) || watches.length === 0) {
      return 'The user is not currently watching any trains.';
    }
    const lines = watches.map(
      (t) =>
        `Train ${t.trainNumber} (${t.routeName}) ${t.departure} \u2192 ${t.arrival} at $${t.coachPrice} on route ${t.origin} \u2192 ${t.destination}`
    );
    return `The user is currently watching these trains: ${lines.join(', ')}.`;
  } catch {
    return 'The user is not currently watching any trains.';
  }
}

/**
 * Send a message to Claude via Railway backend (API key never leaves server).
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} watchContext - current watch context string
 */
export async function chatWithClaude(messages, watchContext = '') {
  // Client-side input guards
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Messages array is required');
  }
  if (messages.length > 50) {
    throw new Error('Too many messages');
  }

  // Sanitize: trim content, enforce max length per message
  const sanitized = messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: String(m.content || '').slice(0, 2000),
  }));

  const context = String(watchContext || '').slice(0, 5000);

  const res = await fetch(`${RAILWAY_URL}/chat`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ messages: sanitized, watchContext: context }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Chat error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.content || '';
}

/**
 * Parse WATCH_DATA JSON from Claude's final message.
 */
export function parseWatchData(text) {
  const match = text.match(/WATCH_DATA:\s*(\{[^}]+\})/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

// ─── Prices ─────────────────────────────────────────────────────────────────

/**
 * Fetch trains/prices for a route.
 * Falls back to mock data until Railway /prices endpoint exists.
 */
export async function fetchPrices(origin, destination, date) {
  // Sanitize query params — station codes are 3 uppercase letters, date is YYYY-MM-DD
  const safeOrigin = encodeURIComponent(String(origin || '').toUpperCase().slice(0, 3));
  const safeDest = encodeURIComponent(String(destination || '').toUpperCase().slice(0, 3));
  const safeDate = encodeURIComponent(String(date || '').slice(0, 10));

  try {
    const resp = await fetch(
      `${RAILWAY_URL}/prices?origin=${safeOrigin}&destination=${safeDest}&date=${safeDate}`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data.trains) && data.trains.length > 0) {
        return data.trains;
      }
    }
  } catch {
    // Railway endpoint doesn't exist yet — fall through to mock
  }

  console.log('[Argus] Using mock train data (Railway /prices not available yet)');
  await new Promise((r) => setTimeout(r, 1500));
  return MOCK_TRAINS;
}

// ─── Watch registration ─────────────────────────────────────────────────────

export async function registerWatch(watchData, subscription = null) {
  // Sanitize inputs before sending
  const origin = String(watchData.origin || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
  const destination = String(watchData.destination || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
  const date = String(watchData.date || '').slice(0, 10);

  if (origin.length !== 3 || destination.length !== 3) {
    throw new Error('Invalid station code');
  }

  const trains = Array.isArray(watchData.trains) ? watchData.trains.slice(0, 20) : [];

  const body = {
    route: { origin, destination, date },
    trains,
  };
  if (subscription) {
    body.subscription = subscription;
  }

  const resp = await fetch(`${RAILWAY_URL}/register`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    throw new Error(`Register failed: ${resp.status}`);
  }
  return resp.json();
}

// ─── Push / VAPID ───────────────────────────────────────────────────────────

export async function fetchVapidPublicKey() {
  const resp = await fetch(`${RAILWAY_URL}/vapid-public-key`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!resp.ok) throw new Error(`VAPID key fetch failed: ${resp.status}`);
  const data = await resp.json();
  return data.publicKey;
}

export async function sendSubscription(subscription, watchId = null) {
  const body = { subscription };
  if (watchId) body.watch_id = watchId;

  const resp = await fetch(`${RAILWAY_URL}/subscribe`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  });

  if (!resp.ok) throw new Error(`Subscribe failed: ${resp.status}`);
  return resp.json();
}

export async function fetchHealth() {
  const resp = await fetch(`${RAILWAY_URL}/health`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!resp.ok) throw new Error(`Health check failed: ${resp.status}`);
  return resp.json();
}
