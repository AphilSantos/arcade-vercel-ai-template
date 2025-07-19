import { useState, useEffect, useRef } from 'react';
import type { ToolInvocation } from 'ai';
import { MediaGenerationLoading } from './media-generation-loading';
import { ToolArcadeAuthorization } from './tool-arcade-authorization';

type ToolMediaAuthorizationProps = {
  toolInvocation: ToolInvocation;
  addToolResult: ({
    toolCallId,
    result,
  }: {
    toolCallId: string;
    result: any;
  }) => void;
  type: 'image' | 'video';
};

export const ToolMediaAuthorization = ({
  toolInvocation,
  addToolResult,
  type,
}: ToolMediaAuthorizationProps) => {
  const [showError, setShowError] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    
    // Set up grace period timer
    const graceTime = type === 'video' ? 180000 : 60000; // 3 minutes for video, 1 minute for images
    
    const timer = setTimeout(() => {
      setShowError(true);
    }, graceTime);

    return () => clearTimeout(timer);
  }, [toolInvocation.toolCallId, type]);

  // Always show loading during grace period
  if (!showError) {
    return <MediaGenerationLoading toolInvocation={toolInvocation} type={type} />;
  }

  // After grace period, show the normal arcade authorization (which may show errors)
  return (
    <ToolArcadeAuthorization
      toolInvocation={toolInvocation}
      addToolResult={addToolResult}
    />
  );
};