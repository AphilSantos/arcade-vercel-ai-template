/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import type { FlightData } from './types';
import { FlightCard } from './FlightCard';
import { FlightFilters } from './FlightFilters';

type StopFilter = 'all' | 'nonstop' | '1stop' | '2+stops';
type SortOption =
  | 'price-asc'
  | 'price-desc'
  | 'duration-asc'
  | 'duration-desc'
  | 'stops-asc'
  | 'stops-desc';

export default function FlightMessage({ data }: { data: FlightData }) {
  const [expandedFlight, setExpandedFlight] = useState<string | null>(null);
  const [showAllFlights, setShowAllFlights] = useState(false);
  const [stopFilter, setStopFilter] = useState<StopFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('price-asc');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [minDuration, setMinDuration] = useState(0);
  const [maxDuration, setMaxDuration] = useState(24);

  const toggleFlightDetails = (flightId: string) => {
    setExpandedFlight(expandedFlight === flightId ? null : flightId);
  };

  const filteredAndSortedFlights = useMemo(() => {
    let filtered = [...data.flights];

    // Apply stop filter
    if (stopFilter !== 'all') {
      filtered = filtered.filter((flight) => {
        const stops = flight.layovers?.length || 0;
        if (stopFilter === 'nonstop') return stops === 0;
        if (stopFilter === '1stop') return stops === 1;
        if (stopFilter === '2+stops') return stops >= 2;
        return true;
      });
    }

    // Apply price filter
    filtered = filtered.filter((flight) => {
      const price = flight.price || 0;
      return price >= minPrice && price <= maxPrice;
    });

    // Apply duration filter
    filtered = filtered.filter((flight) => {
      const duration = flight.total_duration / 60; // Convert minutes to hours
      return duration >= minDuration && duration <= maxDuration;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'price-asc') {
        return (a.price || 0) - (b.price || 0);
      }
      if (sortBy === 'price-desc') {
        return (b.price || 0) - (a.price || 0);
      }
      if (sortBy === 'duration-asc') {
        return a.total_duration - b.total_duration;
      }
      if (sortBy === 'duration-desc') {
        return b.total_duration - a.total_duration;
      }
      if (sortBy === 'stops-asc') {
        const stopsA = a.layovers?.length || 0;
        const stopsB = b.layovers?.length || 0;
        return stopsA - stopsB;
      }
      if (sortBy === 'stops-desc') {
        const stopsA = a.layovers?.length || 0;
        const stopsB = b.layovers?.length || 0;
        return stopsB - stopsA;
      }
      return 0;
    });

    return filtered;
  }, [
    data.flights,
    stopFilter,
    sortBy,
    minPrice,
    maxPrice,
    minDuration,
    maxDuration,
  ]);

  const displayLimit = showAllFlights ? filteredAndSortedFlights.length : 3;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-lg overflow-hidden shadow-sm">
      <div className="p-4 border-b dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <h3 className="text-lg font-medium dark:text-white">
          Halifax (YHZ) to San Francisco (SFO)
        </h3>
        <p className="text-sm text-muted-foreground dark:text-zinc-400">
          April 15, 2025 • One way
        </p>
        {data.price_insights && (
          <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium dark:text-zinc-200">
                  Price Insights
                </p>
                <p className="text-xs text-muted-foreground dark:text-zinc-400">
                  {data.price_insights.price_level === 'high'
                    ? 'Higher than usual'
                    : data.price_insights.price_level === 'low'
                      ? 'Lower than usual'
                      : 'Typical price range'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium dark:text-zinc-200">
                  ${data.price_insights.lowest_price}
                </p>
                <p className="text-xs text-muted-foreground dark:text-zinc-400">
                  Lowest price
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-b dark:border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground dark:text-zinc-400">
            {filteredAndSortedFlights.length}{' '}
            {filteredAndSortedFlights.length === 1 ? 'flight' : 'flights'} found
          </p>
          <FlightFilters
            stopFilter={stopFilter}
            setStopFilter={setStopFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            minPrice={minPrice}
            maxPrice={maxPrice}
            setMinPrice={setMinPrice}
            setMaxPrice={setMaxPrice}
            minDuration={minDuration}
            maxDuration={maxDuration}
            setMinDuration={setMinDuration}
            setMaxDuration={setMaxDuration}
          />
        </div>
      </div>

      <div className="divide-y dark:divide-zinc-800">
        {filteredAndSortedFlights.slice(0, displayLimit).map((flight) => {
          const flightId = `${flight.flights[0].flight_number}-${flight.price}`;
          return (
            <FlightCard
              key={flightId}
              flight={flight}
              isExpanded={expandedFlight === flightId}
              onToggleDetails={() => toggleFlightDetails(flightId)}
            />
          );
        })}
      </div>

      {!showAllFlights && filteredAndSortedFlights.length > 3 && (
        <div className="p-4 text-center border-t dark:border-zinc-800">
          <Button
            variant="outline"
            className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:hover:border-zinc-600"
            onClick={() => setShowAllFlights(true)}
          >
            View all {filteredAndSortedFlights.length} options
          </Button>
        </div>
      )}

      {showAllFlights && filteredAndSortedFlights.length > 3 && (
        <div className="p-4 text-center border-t dark:border-zinc-800">
          <Button
            variant="outline"
            className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:hover:border-zinc-600"
            onClick={() => setShowAllFlights(false)}
          >
            Show fewer options
          </Button>
        </div>
      )}
    </div>
  );
}
