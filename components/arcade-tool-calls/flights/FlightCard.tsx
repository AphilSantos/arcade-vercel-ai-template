/* eslint-disable @next/next/no-img-element */
'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ChevronDown,
  ChevronUp,
  Leaf,
  Luggage,
  Wifi,
  Zap,
  PlaneTakeoff,
} from 'lucide-react';
import type { FlightData } from './types';
import {
  formatTime,
  formatDuration,
  getEmissionsLabel,
  getEmissionsColor,
} from './utils';
import { FlightDetails } from './FlightDetails';

interface FlightCardProps {
  flight: FlightData['flights'][0];
  isExpanded: boolean;
  onToggleDetails: () => void;
}

export function FlightCard({
  flight,
  isExpanded,
  onToggleDetails,
}: FlightCardProps) {
  return (
    <Card className="border-0 rounded-none shadow-none dark:bg-zinc-900">
      <CardContent
        className={`p-4 ${isExpanded ? 'bg-zinc-50 dark:bg-zinc-800/50' : ''}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <img
              src={flight.airline_logo || '/placeholder.svg'}
              alt={flight.flights[0].airline}
              className="size-8 mr-3 bg-white dark:bg-zinc-700 rounded-full p-0.5"
            />
            <div>
              <div className="flex items-center">
                <p className="font-medium text-zinc-900 dark:text-white">
                  {flight.flights[0].airline}
                </p>
                <Badge
                  variant="outline"
                  className="ml-2 font-mono border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {flight.flights[0].flight_number}
                  {flight.flights.length > 1 && '+'}
                </Badge>
                {flight.layovers && flight.layovers.length > 0 && (
                  <Badge
                    variant="outline"
                    className="ml-2 border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {flight.layovers.length}{' '}
                    {flight.layovers.length === 1 ? 'stop' : 'stops'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            {flight.price ? (
              <div>
                <p className="text-xl font-bold text-zinc-900 dark:text-white">
                  ${flight.price}
                </p>
                {flight.carbon_emissions && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full inline-flex items-center gap-1">
                    <Leaf className="size-3" />
                    {Math.round(flight.carbon_emissions.this_flight / 1000)} kg
                    CO₂
                  </p>
                )}
              </div>
            ) : (
              <div className="text-right">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Price not available
                </p>
                {flight.carbon_emissions && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full inline-flex items-center gap-1">
                    <Leaf className="size-3" />
                    {Math.round(flight.carbon_emissions.this_flight / 1000)} kg
                    CO₂
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-center">
            <p className="text-lg font-medium text-zinc-900 dark:text-white">
              {formatTime(flight.flights[0].departure_airport.time)}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {flight.flights[0].departure_airport.id}
            </p>
          </div>

          <div className="flex-1 px-8">
            <div className="text-xs text-center mb-3 text-zinc-500 dark:text-zinc-300">
              {formatDuration(flight.total_duration)}
            </div>
            <div className="relative">
              <div className="h-0.5 bg-zinc-200 dark:bg-zinc-700 w-full" />
              {flight.flights.map((segment, segmentIndex) => {
                let startPosition = 0;
                for (let i = 0; i < segmentIndex; i++) {
                  startPosition +=
                    (flight.flights[i].duration / flight.total_duration) * 100;
                  if (flight.layovers?.[i]) {
                    startPosition +=
                      (flight.layovers[i].duration / flight.total_duration) *
                      100;
                  }
                }

                const width = (segment.duration / flight.total_duration) * 100;

                return (
                  <div key={`segment-${segment.flight_number}`}>
                    <div
                      className="absolute h-0.5 bg-blue-500 dark:bg-blue-400 top-0 z-0"
                      style={{ left: `${startPosition}%`, width: `${width}%` }}
                    />
                    {segmentIndex > 0 && (
                      <div
                        className="absolute -top-2 -translate-x-1/2 size-4 rounded-full bg-blue-500 dark:bg-blue-400 flex items-center justify-center z-10"
                        style={{ left: `${startPosition}%` }}
                      >
                        <PlaneTakeoff className="size-2.5 text-white dark:text-zinc-900" />
                      </div>
                    )}
                  </div>
                );
              })}
              {flight.layovers?.map((layover, layoverIndex) => {
                let startPosition = 0;
                for (let i = 0; i <= layoverIndex; i++) {
                  startPosition +=
                    (flight.flights[i].duration / flight.total_duration) * 100;
                  if (i < layoverIndex && flight.layovers?.[i]) {
                    startPosition +=
                      (flight.layovers[i].duration / flight.total_duration) *
                      100;
                  }
                }

                const width = (layover.duration / flight.total_duration) * 100;

                return (
                  <div
                    key={`layover-${layover.id}`}
                    className="absolute h-0.5 bg-amber-500 dark:bg-amber-400 top-0 z-0"
                    style={{ left: `${startPosition}%`, width: `${width}%` }}
                  />
                );
              })}
              {flight.layovers?.map((layover, layoverIndex) => {
                let position = 0;
                for (let i = 0; i <= layoverIndex; i++) {
                  position +=
                    (flight.flights[i].duration / flight.total_duration) * 100;
                  if (i < layoverIndex && flight.layovers?.[i]) {
                    position +=
                      (flight.layovers[i].duration / flight.total_duration) *
                      100;
                  }
                }

                return (
                  <div
                    key={`${layover.id}-${layoverIndex}`}
                    className="absolute -top-2 -translate-x-1/2 size-4 rounded-full bg-white dark:bg-zinc-800 border border-amber-500 dark:border-amber-400 flex items-center justify-center z-10"
                    style={{ left: `${position}%` }}
                  >
                    <div className="size-2 bg-amber-500 dark:bg-amber-400 rounded-full" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg font-medium text-zinc-900 dark:text-white">
              {formatTime(
                flight.flights[flight.flights.length - 1].arrival_airport.time,
              )}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {flight.flights[flight.flights.length - 1].arrival_airport.id}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {flight.carbon_emissions && (
            <Badge
              variant="secondary"
              className={getEmissionsColor(
                flight.carbon_emissions.difference_percent,
              )}
            >
              <Leaf className="size-3 mr-1" />
              {getEmissionsLabel(flight.carbon_emissions.difference_percent)}
            </Badge>
          )}

          {flight.flights.some((f) =>
            f.extensions?.some((e) => e?.includes('Wi-Fi')),
          ) && (
            <Badge
              variant="secondary"
              className="bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
            >
              <Wifi className="size-3 mr-1" />
              Wi-Fi
            </Badge>
          )}

          {flight.flights.some((f) =>
            f.extensions?.some((e) => e?.includes('power')),
          ) && (
            <Badge
              variant="secondary"
              className="bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
            >
              <Zap className="size-3 mr-1" />
              Power
            </Badge>
          )}

          {flight.extensions?.some((e) =>
            e?.includes('checked bag included'),
          ) && (
            <Badge
              variant="secondary"
              className="bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
            >
              <Luggage className="size-3 mr-1" />
              Bag included
            </Badge>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onToggleDetails}
          className="w-full flex items-center justify-center gap-2 border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:hover:border-zinc-600"
        >
          {isExpanded ? 'Hide details' : 'Show details'}
          {isExpanded ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </Button>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <FlightDetails flight={flight} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
