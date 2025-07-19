import { DocumentToolCall } from './document';

import type { ToolInvocation } from 'ai';
import { cx } from 'class-variance-authority';
import { Weather } from './weather';
import { DocumentPreview } from './document-preview';
import { ToolArcadeAuthorization } from './tool-arcade-authorization';
import { ToolMediaAuthorization } from './tool-media-authorization';

type ToolCallProps = {
  toolInvocation: ToolInvocation;
  isReadonly: boolean;
  addToolResult: ({
    toolCallId,
    result,
  }: {
    toolCallId: string;
    result: any;
  }) => void;
};

export function ToolCall({
  toolInvocation,
  isReadonly,
  addToolResult,
}: ToolCallProps) {
  const { args, toolName } = toolInvocation;

  if (toolName === 'getWeather') {
    return (
      <div className={cx({ skeleton: true })}>
        <Weather />
      </div>
    );
  }

  if (toolName === 'createDocument') {
    return (
      <div>
        <DocumentPreview isReadonly={isReadonly} args={args} />
      </div>
    );
  }

  if (toolName === 'updateDocument') {
    return (
      <div>
        <DocumentToolCall type="update" args={args} isReadonly={isReadonly} />
      </div>
    );
  }

  if (toolName === 'requestSuggestions') {
    return (
      <div>
        <DocumentToolCall
          type="request-suggestions"
          args={args}
          isReadonly={isReadonly}
        />
      </div>
    );
  }

  // Handle media generation tools with specialized execution and loading UI
  if (toolName === 'generateImage') {
    return (
      <div>
        <ToolMediaAuthorization 
          toolInvocation={toolInvocation} 
          addToolResult={addToolResult}
          type="image" 
        />
      </div>
    );
  }

  if (toolName === 'generateVideo') {
    return (
      <div>
        <ToolMediaAuthorization 
          toolInvocation={toolInvocation} 
          addToolResult={addToolResult}
          type="video" 
        />
      </div>
    );
  }

  if (toolName === 'editImage') {
    return (
      <div>
        <ToolMediaAuthorization 
          toolInvocation={toolInvocation} 
          addToolResult={addToolResult}
          type="image" 
        />
      </div>
    );
  }

  return (
    <div>
      <ToolArcadeAuthorization
        toolInvocation={toolInvocation}
        addToolResult={addToolResult}
      />
    </div>
  );
}
