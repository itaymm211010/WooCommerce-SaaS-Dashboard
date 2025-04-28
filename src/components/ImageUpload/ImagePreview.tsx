
import React from 'react';
import { Card } from '@/components/ui/card';
import { Eye } from 'lucide-react';
import { ImageVersion } from '@/services/storage/types';

interface ImagePreviewProps {
  url: string;
  version: ImageVersion;
  onClick?: () => void;
}

export function ImagePreview({ url, version, onClick }: ImagePreviewProps) {
  return (
    <Card className="relative group cursor-pointer overflow-hidden" onClick={onClick}>
      <img
        src={url}
        alt={`תצוגה ${version}`}
        className="w-full h-32 object-cover transition-transform group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Eye className="w-6 h-6 text-white" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-xs py-1 px-2">
        {version}
      </div>
    </Card>
  );
}
