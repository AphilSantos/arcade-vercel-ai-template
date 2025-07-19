'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Download, Eye, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';

interface ImageResultProps {
  result: {
    success: boolean;
    images?: Array<{ url: string; b64_json?: string }>;
    videos?: Array<{ url: string; b64_json?: string }>;
    models_used?: string[];
    model_used?: string;
    prompt: string;
    error?: string;
  };
  type: 'image' | 'video';
}

export function ImageResult({ result, type }: ImageResultProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!result.success) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-red-600">
            {type === 'image' ? 'Image Generation Failed' : 'Video Generation Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{result.error}</p>
        </CardContent>
      </Card>
    );
  }

  const media = type === 'image' ? result.images : result.videos;
  const models = result.models_used || (result.model_used ? [result.model_used] : []);

  if (!media || media.length === 0) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>No {type}s generated</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The {type} generation completed but no {type}s were returned.
          </p>
        </CardContent>
      </Card>
    );
  }

  const downloadMedia = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `generated-${type}-${index + 1}.${type === 'image' ? 'png' : 'mp4'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {type === 'image' ? '🎨' : '🎬'} Generated {type === 'image' ? 'Images' : 'Videos'}
            <Badge variant="secondary">{media.length}</Badge>
          </CardTitle>
          <div className="flex gap-1">
            {models.map((model, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {model.split('/').pop()?.replace(':free', '')}
              </Badge>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">"{result.prompt}"</p>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-4 ${media.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {media.map((item, index) => (
            <div key={index} className="relative group">
              <div className="relative overflow-hidden rounded-lg border bg-muted">
                {type === 'image' ? (
                  <Image
                    src={item.url}
                    alt={`Generated image ${index + 1}`}
                    width={512}
                    height={512}
                    className="w-full h-auto object-cover transition-transform group-hover:scale-105"
                    unoptimized
                  />
                ) : (
                  <video
                    src={item.url}
                    controls
                    className="w-full h-auto object-cover"
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
                
                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    {type === 'image' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-white/90 hover:bg-white text-black"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                          <div className="relative">
                            <Image
                              src={item.url}
                              alt={`Generated image ${index + 1} - Full size`}
                              width={1024}
                              height={1024}
                              className="w-full h-auto object-contain"
                              unoptimized
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/90 hover:bg-white text-black"
                      onClick={() => downloadMedia(item.url, index)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Model badge for individual items when multiple models */}
              {models.length > 1 && (
                <Badge 
                  variant="secondary" 
                  className="absolute top-2 left-2 text-xs bg-white/90 text-black"
                >
                  {models[index]?.split('/').pop()?.replace(':free', '') || `Model ${index + 1}`}
                </Badge>
              )}
            </div>
          ))}
        </div>
        
        {media.length > 1 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Generated {media.length} {type}s using {models.length > 1 ? 'multiple models' : 'AI'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}