import { useState, useRef, useEffect } from 'react';
import { filterStations } from '../utils/stations';

/**
 * Station input with autocomplete dropdown.
 * value = station code (e.g. "NYP")
 * onChange(code) called when user selects a station
 */
export default function StationInput({ label, placeholder, value, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const wrapRef = useRef(null);

  // Display the station name if a code is selected
  const displayValue = value
    ? filterStations(value).find((s) => s.code === value)
      ? `${value}`
      : value
    : query;

  useEffect(() => {
    setSuggestions(filterStations(query));
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(''); // clear selection while typing
    setOpen(true);
  };

  const handleSelect = (station) => {
    onChange(station.code);
    setQuery(station.code);
    setOpen(false);
  };

  const handleFocus = () => {
    setOpen(true);
    if (value) {
      setQuery(value);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <label className="block text-gray-400 text-xs font-medium mb-1.5">{label}</label>
      <input
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        className="w-full bg-navy-light rounded-xl px-4 py-3 text-white text-sm
                   placeholder-gray-600 outline-none focus:ring-2 focus:ring-electric/50
                   transition-all"
      />

      {open && suggestions.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-navy-lighter rounded-xl
                        border border-white/10 shadow-xl max-h-48 overflow-y-auto">
          {suggestions.map((s) => (
            <button
              key={s.code}
              onClick={() => handleSelect(s)}
              className="w-full text-left px-4 py-2.5 hover:bg-electric/10 transition-colors
                         flex items-center gap-3 border-b border-white/5 last:border-0"
            >
              <span className="text-electric font-mono font-bold text-sm w-8">{s.code}</span>
              <span className="text-gray-300 text-sm">{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
