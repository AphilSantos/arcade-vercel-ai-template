/**
 * Airport information for departure and arrival
 */
export interface Airport {
  id: string;
  name: string;
  time: string;
}

/**
 * Information about a flight segment
 */
export interface FlightSegment {
  airline: string;
  airline_logo: string;
  airplane: string;
  arrival_airport: Airport;
  departure_airport: Airport;
  duration: number;
  extensions: string[];
  flight_number: string;
  legroom: string;
  ticket_also_sold_by?: string[];
  travel_class: string;
  often_delayed_by_over_30_min?: boolean;
  plane_and_crew_by?: string;
}

/**
 * Information about a layover between flight segments
 */
export interface Layover {
  duration: number;
  id: string;
  name: string;
  overnight?: boolean;
}

/**
 * Carbon emissions information for a flight
 */
export interface CarbonEmissions {
  difference_percent: number;
  this_flight: number;
  typical_for_this_route: number;
}

/**
 * Price history data point [timestamp, price]
 */
export type PriceHistoryPoint = [number, number];

/**
 * Price insights for flights
 */
export interface PriceInsights {
  lowest_price: number;
  price_history: PriceHistoryPoint[];
  price_level: 'low' | 'average' | 'high';
  typical_price_range: [number, number];
}

/**
 * Complete flight option information
 */
export interface Flight {
  airline_logo: string;
  booking_token?: string;
  carbon_emissions?: CarbonEmissions;
  extensions?: string[];
  flights: FlightSegment[];
  layovers?: Layover[];
  price?: number;
  total_duration: number;
  type: string;
}

/**
 * Complete flight data structure
 */
export interface FlightData {
  flights: Flight[];
  price_insights?: PriceInsights;
}

// Filter types
export interface FlightFilters {
  stops: number[]; // -1 for any, 0 for nonstop, 1 for 1 stop, 2 for 2+ stops
  airlines: string[];
  priceRange: [number, number] | null;
  duration: [number, number] | null;
  baggage: boolean | null; // true for included, false for fees apply, null for any
}
