/**
 * Common Amtrak NEC station codes for autocomplete.
 */
const STATIONS = [
  { code: 'NYP', name: 'New York Penn Station' },
  { code: 'PHL', name: 'Philadelphia 30th St' },
  { code: 'WAS', name: 'Washington Union Station' },
  { code: 'BOS', name: 'Boston South Station' },
  { code: 'BAL', name: 'Baltimore Penn Station' },
  { code: 'NWK', name: 'Newark Penn Station' },
  { code: 'WIL', name: 'Wilmington' },
  { code: 'TRE', name: 'Trenton' },
  { code: 'NHV', name: 'New Haven' },
  { code: 'PVD', name: 'Providence' },
  { code: 'STM', name: 'Stamford' },
  { code: 'ALB', name: 'Albany-Rensselaer' },
  { code: 'MET', name: 'Metropark' },
  { code: 'EWR', name: 'Newark Airport' },
  { code: 'CHI', name: 'Chicago Union Station' },
];

export default STATIONS;

/**
 * Filter stations by query (matches code or name).
 */
export function filterStations(query) {
  if (!query || query.length === 0) return STATIONS;
  const q = query.toLowerCase();
  return STATIONS.filter(
    (s) =>
      s.code.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q)
  );
}
