import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { Filter, ChevronDown, ArrowUpDown, X } from 'lucide-react';

type StopFilter = 'all' | 'nonstop' | '1stop' | '2+stops';
type SortOption =
  | 'price-asc'
  | 'price-desc'
  | 'duration-asc'
  | 'duration-desc'
  | 'stops-asc'
  | 'stops-desc';

interface FlightFiltersProps {
  stopFilter: StopFilter;
  setStopFilter: (filter: StopFilter) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  minPrice: number;
  maxPrice: number;
  setMinPrice: (price: number) => void;
  setMaxPrice: (price: number) => void;
  minDuration: number;
  maxDuration: number;
  setMinDuration: (duration: number) => void;
  setMaxDuration: (duration: number) => void;
}

export function FlightFilters({
  stopFilter,
  setStopFilter,
  sortBy,
  setSortBy,
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
  minDuration,
  maxDuration,
  setMinDuration,
  setMaxDuration,
}: FlightFiltersProps) {
  const hasActiveFilters =
    stopFilter !== 'all' ||
    minPrice > 0 ||
    maxPrice < 2000 ||
    minDuration > 0 ||
    maxDuration < 24;

  const clearFilters = () => {
    setStopFilter('all');
    setMinPrice(0);
    setMaxPrice(2000);
    setMinDuration(0);
    setMaxDuration(24);
  };

  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`flex items-center gap-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 ${
              hasActiveFilters ? 'border-primary dark:border-primary' : ''
            }`}
          >
            <Filter className="size-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {
                  [
                    stopFilter !== 'all',
                    minPrice > 0 || maxPrice < 2000,
                    minDuration > 0 || maxDuration < 24,
                  ].filter(Boolean).length
                }
              </span>
            )}
            <ChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 p-4 space-y-6">
          <div className="space-y-3">
            <h4 className="text-sm font-medium dark:text-zinc-200">Stops</h4>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={stopFilter === 'all' ? 'default' : 'outline'}
                className={`cursor-pointer transition-colors ${
                  stopFilter === 'all'
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    : 'dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                }`}
                onClick={() => setStopFilter('all')}
              >
                All flights
              </Badge>
              <Badge
                variant={stopFilter === 'nonstop' ? 'default' : 'outline'}
                className={`cursor-pointer transition-colors ${
                  stopFilter === 'nonstop'
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    : 'dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                }`}
                onClick={() => setStopFilter('nonstop')}
              >
                Nonstop
              </Badge>
              <Badge
                variant={stopFilter === '1stop' ? 'default' : 'outline'}
                className={`cursor-pointer transition-colors ${
                  stopFilter === '1stop'
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    : 'dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                }`}
                onClick={() => setStopFilter('1stop')}
              >
                1 stop
              </Badge>
              <Badge
                variant={stopFilter === '2+stops' ? 'default' : 'outline'}
                className={`cursor-pointer transition-colors ${
                  stopFilter === '2+stops'
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    : 'dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                }`}
                onClick={() => setStopFilter('2+stops')}
              >
                2+ stops
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium dark:text-zinc-200">
              Price Range
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    className="w-full text-sm bg-transparent border dark:border-zinc-700 rounded px-3 py-1.5 dark:text-zinc-300"
                    placeholder="Min"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">to</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full text-sm bg-transparent border dark:border-zinc-700 rounded px-3 py-1.5 dark:text-zinc-300"
                    placeholder="Max"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                </div>
              </div>
              <div className="px-2">
                <Slider
                  value={[minPrice, maxPrice]}
                  onValueChange={([min, max]) => {
                    setMinPrice(min);
                    setMaxPrice(max);
                  }}
                  min={0}
                  max={2000}
                  step={50}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium dark:text-zinc-200">Duration</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={minDuration}
                    onChange={(e) => setMinDuration(Number(e.target.value))}
                    className="w-full text-sm bg-transparent border dark:border-zinc-700 rounded px-3 py-1.5 dark:text-zinc-300"
                    placeholder="Min"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    h
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">to</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    value={maxDuration}
                    onChange={(e) => setMaxDuration(Number(e.target.value))}
                    className="w-full text-sm bg-transparent border dark:border-zinc-700 rounded px-3 py-1.5 dark:text-zinc-300"
                    placeholder="Max"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    h
                  </span>
                </div>
              </div>
              <div className="px-2">
                <Slider
                  value={[minDuration, maxDuration]}
                  onValueChange={([min, max]) => {
                    setMinDuration(min);
                    setMaxDuration(max);
                  }}
                  min={0}
                  max={24}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {hasActiveFilters ? (
            <div className="pt-2 border-t dark:border-zinc-800">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-sm text-muted-foreground hover:text-foreground dark:hover:text-zinc-200"
                onClick={clearFilters}
              >
                <X className="size-4 mr-2" />
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="pt-4" />
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
          >
            <ArrowUpDown className="size-4" />
            Sort by
            <ChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          <div className="p-2 space-y-1">
            <button
              type="button"
              className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                sortBy === 'price-asc'
                  ? 'text-primary dark:text-primary'
                  : 'dark:text-zinc-300'
              }`}
              onClick={() => setSortBy('price-asc')}
            >
              Price: Low to High
            </button>
            <button
              type="button"
              className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                sortBy === 'price-desc'
                  ? 'text-primary dark:text-primary'
                  : 'dark:text-zinc-300'
              }`}
              onClick={() => setSortBy('price-desc')}
            >
              Price: High to Low
            </button>
            <button
              type="button"
              className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                sortBy === 'duration-asc'
                  ? 'text-primary dark:text-primary'
                  : 'dark:text-zinc-300'
              }`}
              onClick={() => setSortBy('duration-asc')}
            >
              Duration: Shortest
            </button>
            <button
              type="button"
              className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                sortBy === 'duration-desc'
                  ? 'text-primary dark:text-primary'
                  : 'dark:text-zinc-300'
              }`}
              onClick={() => setSortBy('duration-desc')}
            >
              Duration: Longest
            </button>
            <button
              type="button"
              className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                sortBy === 'stops-asc'
                  ? 'text-primary dark:text-primary'
                  : 'dark:text-zinc-300'
              }`}
              onClick={() => setSortBy('stops-asc')}
            >
              Stops: Fewest
            </button>
            <button
              type="button"
              className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                sortBy === 'stops-desc'
                  ? 'text-primary dark:text-primary'
                  : 'dark:text-zinc-300'
              }`}
              onClick={() => setSortBy('stops-desc')}
            >
              Stops: Most
            </button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
