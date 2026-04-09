const RAILWAY_URL = import.meta.env.VITE_RAILWAY_URL || 'https://argus-agent-production.up.railway.app';

// ─── Mock data (used until /prices endpoint is built on Railway) ─────────

const MOCK_TRAINS = [
  { trainNumber: '179', routeName: 'Northeast Regional', departure: '7:05 AM', arrival: '8:35 AM', duration: '1h 30m', coachPrice: 34, bizPrice: 96 },
  { trainNumber: '111', routeName: 'Northeast Regional', departure: '9:05 AM', arrival: '10:35 AM', duration: '1h 30m', coachPrice: 68, bizPrice: 96 },
  { trainNumber: '89', routeName: 'Palmetto', departure: '3:05 PM', arrival: '4:35 PM', duration: '1h 30m', coachPrice: 95, bizPrice: 137 },
  { trainNumber: '651', routeName: 'Keystone Service', departure: '1:05 PM', arrival: '2:45 PM', duration: '1h 40m', coachPrice: 15, bizPrice: null },
];

// ─── Common headers ─────────────────────────────────────────────────────────

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// ─── Claude chat ────────────────────────────────────────────────────────────

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
 * Send a message to Claude and get a response.
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} watchContext - current watch context string
 */
export async function chatWithClaude(messages, watchContext = '') {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
  console.log('[Argus] API key present:', !!apiKey, 'length:', apiKey?.length);

  const systemPrompt = buildSystemPrompt(watchContext);

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      ...JSON_HEADERS,
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: systemPrompt,
      messages,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`Claude API error ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  return data.content?.[0]?.text || '';
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
  try {
    const resp = await fetch(
      `${RAILWAY_URL}/prices?origin=${origin}&destination=${destination}&date=${date}`,
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
  const body = {
    route: {
      origin: watchData.origin,
      destination: watchData.destination,
      date: watchData.date || '',
    },
    trains: watchData.trains || [],
  };
  if (subscription) {
    body.subscription = subscription;
  }

  const resp = await fetch(`${RAILWAY_URL}/register`, {
    method: 'POST',
    headers: JSON_HEADERS,
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
    headers: JSON_HEADERS,
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
