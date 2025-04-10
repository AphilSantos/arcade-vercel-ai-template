import { DocumentPreview } from './document-preview';

import type { ToolInvocation } from 'ai';
import { Weather } from './weather';
import { DocumentToolResult } from './document';
import { ToolResultAccordion } from './tool-result-accordion';
import OneWayFlightMessage from './arcade-tool-calls/flights/search-search-one-way-flights';
import RoundtripFlightMessage from './arcade-tool-calls/flights/search-search-roundtrip-flights';

type ToolResultProps = {
  toolInvocation: Extract<ToolInvocation, { state: 'result' }>;
  isReadonly: boolean;
};

export function ToolResult({ toolInvocation, isReadonly }: ToolResultProps) {
  const { result, toolName } = toolInvocation;

  if (toolName === 'getWeather') {
    return <Weather weatherAtLocation={result} />;
  }

  if (toolName === 'createDocument') {
    return <DocumentPreview isReadonly={isReadonly} result={result} />;
  }

  if (toolName === 'updateDocument') {
    return (
      <DocumentToolResult
        type="update"
        result={result}
        isReadonly={isReadonly}
      />
    );
  }

  if (toolName === 'requestSuggestions') {
    return (
      <DocumentToolResult
        type="request-suggestions"
        result={result}
        isReadonly={isReadonly}
      />
    );
  }

  if (toolName === 'Search_SearchOneWayFlights' && result?.output?.value) {
    return <OneWayFlightMessage data={result.output.value} />;
  }

  if (toolName === 'Search_SearchRoundtripFlights' && result?.output?.value) {
    return <RoundtripFlightMessage data={result.output.value} />;
  }

  return <ToolResultAccordion toolInvocation={toolInvocation} />;
}
