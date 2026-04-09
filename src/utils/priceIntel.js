// Known price ranges per route and service type
// Based on observed Northeast Corridor pricing patterns

const ROUTE_RANGES = {
  'NYP-PHL': { min: 10, avg: 52, max: 95, label: 'NYP → PHL' },
  'PHL-NYP': { min: 10, avg: 52, max: 95, label: 'PHL → NYP' },
  'NYP-WAS': { min: 34, avg: 89, max: 148, label: 'NYP → WAS' },
  'WAS-NYP': { min: 34, avg: 89, max: 148, label: 'WAS → NYP' },
  'NYP-BOS': { min: 34, avg: 95, max: 178, label: 'NYP → BOS' },
  'BOS-NYP': { min: 34, avg: 95, max: 178, label: 'BOS → NYP' },
  'PHL-WAS': { min: 18, avg: 55, max: 98, label: 'PHL → WAS' },
  'WAS-PHL': { min: 18, avg: 55, max: 98, label: 'WAS → PHL' },
};

const SERVICE_MULTIPLIERS = {
  'Acela': 2.2,
  'Northeast Regional': 1.0,
  'Keystone Service': 0.6,
  'Palmetto': 1.1,
  'Crescent': 1.1,
  'default': 1.0,
};

export function getPriceIntelligence(origin, destination, routeName, coachPrice, isPeak = false) {
  const routeKey = `${origin}-${destination}`;
  const range = ROUTE_RANGES[routeKey];
  if (!range) return null;

  const multiplier = SERVICE_MULTIPLIERS[routeName] || SERVICE_MULTIPLIERS['default'];
  const adjustedMin = Math.round(range.min * multiplier);
  const adjustedAvg = Math.round(range.avg * multiplier);
  const adjustedMax = Math.round(range.max * multiplier);

  let tier, emoji, label, description, color;

  if (coachPrice <= adjustedMin * 1.2) {
    tier = 'exceptional';
    emoji = '\uD83D\uDD25';
    label = 'Exceptional deal';
    description = `${Math.round(((adjustedAvg - coachPrice) / adjustedAvg) * 100)}% below average`;
    color = '#10B981';
  } else if (coachPrice <= adjustedAvg * 0.85) {
    tier = 'good';
    emoji = '\u2705';
    label = 'Good deal';
    description = 'Below average for this route';
    color = '#34D399';
  } else if (coachPrice <= adjustedAvg * 1.15) {
    tier = 'average';
    emoji = '\uD83D\uDCCA';
    label = 'Average price';
    description = `Typical for this route ($${adjustedMin}-$${adjustedMax})`;
    color = '#94A3B8';
  } else {
    tier = 'high';
    emoji = '\u26A0\uFE0F';
    label = 'Above average';
    description = 'Higher than usual \u2014 consider waiting';
    color = '#F59E0B';
  }

  if (isPeak) {
    description += ' \u00b7 \u23F0 Peak drop window';
  }

  return { tier, emoji, label, description, color, adjustedMin, adjustedAvg, adjustedMax };
}

export function isPeakWindow(departureTime) {
  // Peak drop window = departing within 2 hours
  if (!departureTime) return false;
  const now = new Date();
  const [time, period] = departureTime.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let depHours = hours;
  if (period === 'PM' && hours !== 12) depHours += 12;
  if (period === 'AM' && hours === 12) depHours = 0;
  const depDate = new Date();
  depDate.setHours(depHours, minutes, 0, 0);
  const diffMs = depDate - now;
  const diffMins = diffMs / 60000;
  return diffMins > 0 && diffMins <= 120;
}
