import React, { useRef, useState } from 'react';
import { Camera, Video, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface MediaCaptureProps {
  onMediaCapture: (files: File[]) => void;
  maxFiles?: number;
}

export default function MediaCapture({ onMediaCapture, maxFiles = 5 }: MediaCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    ).slice(0, maxFiles);
    
    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, maxFiles));
    onMediaCapture(validFiles);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const triggerCapture = (accept: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => triggerCapture('image/*')}
          className="flex-1"
        >
          <Camera className="w-4 h-4 mr-2" />
          Photo
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => triggerCapture('video/*')}
          className="flex-1"
        >
          <Video className="w-4 h-4 mr-2" />
          Video
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => triggerCapture('image/*,video/*')}
          className="flex-1"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>
      </div>

      {selectedFiles.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {selectedFiles.map((file, index) => (
            <Card key={index} className="relative p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs truncate">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}