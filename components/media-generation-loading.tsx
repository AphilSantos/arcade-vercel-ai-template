'use client';

import { useState, useEffect } from 'react';
import type { ToolInvocation } from 'ai';
import { Card, CardContent } from './ui/card';
import { Loader2, Image, Video, Clock } from 'lucide-react';
import { Badge } from './ui/badge';

interface MediaGenerationLoadingProps {
  toolInvocation: ToolInvocation;
  type: 'image' | 'video';
}

export const MediaGenerationLoading = ({
  toolInvocation,
  type,
}: MediaGenerationLoadingProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const { args } = toolInvocation;

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getEstimatedTime = () => {
    if (type === 'image') {
      return '10-30 seconds';
    }
    return '1-3 minutes';
  };

  const getProgressMessage = () => {
    if (type === 'image') {
      if (elapsedTime < 10) return 'Initializing AI models...';
      if (elapsedTime < 20) return 'Generating images...';
      if (elapsedTime < 45) return 'Finalizing results...';
      return 'Taking longer than usual, please wait...';
    } else {
      if (elapsedTime < 30) return 'Initializing video generation...';
      if (elapsedTime < 60) return 'Processing video frames...';
      if (elapsedTime < 120) return 'Rendering video...';
      if (elapsedTime < 180) return 'Finalizing video...';
      return 'Video generation is taking longer than expected, please wait...';
    }
  };

  const getRemainingGraceTime = () => {
    const graceTime = type === 'image' ? 60 : 180; // 1 minute for images, 3 minutes for videos
    const remaining = Math.max(0, graceTime - elapsedTime);
    return remaining;
  };

  const Icon = type === 'image' ? Image : Video;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Icon className="size-4 text-blue-600" />
            <Loader2 className="size-4 animate-spin text-blue-600" />
            <span className="font-medium">
              Generating {type}...
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="size-3 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs">
              {formatTime(elapsedTime)}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {getProgressMessage()}
            </span>
            <span className="text-muted-foreground">
              Est. {getEstimatedTime()}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: type === 'image' 
                  ? `${Math.min((elapsedTime / 30) * 100, 95)}%`
                  : `${Math.min((elapsedTime / 180) * 100, 95)}%`
              }}
            />
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          <strong>Prompt:</strong> {args.prompt || 'No prompt provided'}
        </div>

        {elapsedTime > (type === 'image' ? 30 : 90) && getRemainingGraceTime() > 0 && (
          <div className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/20 p-2 rounded border border-blue-200 dark:border-blue-800">
            ⏳ Generation in progress... Will continue for {formatTime(getRemainingGraceTime())} more
          </div>
        )}

        {getRemainingGraceTime() <= 10 && getRemainingGraceTime() > 0 && (
          <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-200 dark:border-amber-800">
            ⚠️ Final {getRemainingGraceTime()} seconds... Generation should complete soon
          </div>
        )}
      </CardContent>
    </Card>
  );
};