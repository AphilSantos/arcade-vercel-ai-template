/* eslint-disable @next/next/no-img-element */
import { Badge } from '@/components/ui/badge';
import { Clock, PlaneTakeoff, PlaneLanding } from 'lucide-react';
import { formatTime, formatDate, formatDuration } from './utils';
import type { FlightData } from './types';

interface FlightDetailsProps {
  flight: FlightData['flights'][0];
}

export function FlightDetails({ flight }: FlightDetailsProps) {
  return (
    <div className="space-y-4">
      {flight.flights.map((segment, segmentIndex) => {
        const isLastSegment = segmentIndex === flight.flights.length - 1;
        const currentLayover = !isLastSegment
          ? flight.layovers?.[segmentIndex]
          : null;

        return (
          <div
            key={`${segment.flight_number}-${segment.departure_airport.id}`}
            className={
              segmentIndex > 0 ? 'pt-4 border-t dark:border-zinc-800' : ''
            }
          >
            <div className="flex items-center mb-2">
              <img
                src={segment.airline_logo || '/placeholder.svg'}
                alt={segment.airline}
                className="size-5 mr-2 bg-white dark:bg-zinc-700 rounded-full p-0.5"
              />
              <span className="font-medium dark:text-white">
                {segment.airline}
              </span>
              <Badge
                variant="outline"
                className="mx-2 font-mono dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {segment.flight_number}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex items-start">
                <PlaneTakeoff className="size-4 mr-2 mt-0.5 text-muted-foreground dark:text-zinc-500" />
                <div>
                  <p className="font-medium dark:text-white">
                    {formatTime(segment.departure_airport.time)}
                  </p>
                  <p className="text-xs dark:text-zinc-400">
                    {formatDate(segment.departure_airport.time)}
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-zinc-500">
                    {segment.departure_airport.name}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <PlaneLanding className="size-4 mr-2 mt-0.5 text-muted-foreground dark:text-zinc-500" />
                <div>
                  <p className="font-medium dark:text-white">
                    {formatTime(segment.arrival_airport.time)}
                  </p>
                  <p className="text-xs dark:text-zinc-400">
                    {formatDate(segment.arrival_airport.time)}
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-zinc-500">
                    {segment.arrival_airport.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <Clock className="size-3 mr-1 text-muted-foreground dark:text-zinc-500" />
              <span className="text-sm dark:text-zinc-300">
                {formatDuration(segment.duration)}
              </span>
            </div>

            {currentLayover && (
              <div className="my-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-md border border-zinc-100 dark:border-zinc-700">
                <p className="dark:text-zinc-200 font-medium">
                  {formatDuration(currentLayover.duration)} layover
                </p>
                <p className="text-sm dark:text-zinc-300">
                  {currentLayover.name} ({currentLayover.id})
                  {currentLayover.overnight && ' • Overnight'}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
