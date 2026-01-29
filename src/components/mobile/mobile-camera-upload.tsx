'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface MobileCameraUploadProps {
  onImageCapture: (file: File) => void;
  onImageRemove?: () => void;
  currentImage?: string | null;
  disabled?: boolean;
}

export function MobileCameraUpload({
  onImageCapture,
  onImageRemove,
  currentImage,
  disabled,
}: MobileCameraUploadProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageCapture(file);
    }
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      {currentImage ? (
        <div className="relative">
          <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200">
            <Image
              src={currentImage}
              alt="Uploaded"
              fill
              className="object-cover"
            />
          </div>
          {onImageRemove && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onImageRemove}
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            {/* Camera Input - Mobile optimized */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled}
            />
            
            {/* Gallery Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled}
            />

            <Button
              type="button"
              onClick={handleCameraClick}
              disabled={disabled}
              className="flex-1 h-14 text-base"
              size="lg"
            >
              <Camera className="h-5 w-5 mr-2" />
              Take Photo
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleGalleryClick}
              disabled={disabled}
              className="flex-1 h-14 text-base"
              size="lg"
            >
              <ImageIcon className="h-5 w-5 mr-2" />
              Choose from Gallery
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
