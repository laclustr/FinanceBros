import React, { useState, useRef, useEffect } from 'react';

interface Props {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  focusColor: 'red' | 'green' | 'blue';
}

const focusClasses = {
  red: 'focus:ring-red-500',
  green: 'focus:ring-green-500',
  blue: 'focus:ring-blue-500',
};

const SearchField: React.FC<Props> = ({ id, name, label, placeholder, focusColor }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ ticker: string; name: string }[]>([]);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!query.trim()) {
        setResults([]);
        setShowResults(false);
        return;
      }
      try {
        const res = await fetch(`http://localhost:3000/api/user/fetch/tickers?query=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Failed to fetch tickers');
        const data = await res.json();

        if (data && Array.isArray(data.results)) {
          setResults(data.results);
          setShowResults(true);
        } else {
          setResults([]);
          setShowResults(false);
        }
      } catch {
        setResults([]);
        setShowResults(false);
      }
    }
  };

  // Clicking a result sets input and hides list
  const handleSelect = (ticker: string) => {
    setQuery(ticker);
    setShowResults(false);
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type="text"
        id={id}
        name={name}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
          focusClasses[focusColor]
        } focus:border-transparent transition-colors text-sm focus:ring-2`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleSearch}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showResults}
        aria-controls={`${id}-results`}
      />
      {showResults && results.length > 0 && (
        <ul
          id={`${id}-results`}
          className={`absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg overflow-auto
            ${
              results.length > 3
                ? 'max-h-48' // fixed max height and scroll if > 3 results
                : ''
            }
            sm:flex sm:flex-wrap sm:gap-2
          `}
          role="listbox"
        >
          {results.map((item, index) => (
            <li
              key={index}
              role="option"
              tabIndex={0}
              onClick={() => handleSelect(item.ticker)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(item.ticker);
                }
              }}
              className="cursor-pointer px-3 py-2 border-b last:border-b-0 border-gray-200 hover:bg-blue-100 focus:bg-blue-200 sm:border sm:rounded-md sm:border-gray-300"
            >
              <strong>{item.ticker}</strong>: {item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchField;
