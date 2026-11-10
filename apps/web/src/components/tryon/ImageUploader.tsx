import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';

interface ImageUploaderProps {
  image: string | null;
  onImageSelected: (dataUrl: string) => void;
  onImageRemoved: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  image,
  onImageSelected,
  onImageRemoved,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const processFile = (file: File) => {
    setUploadError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid format. Please upload a JPEG, PNG, or WebP photo.');
      return;
    }

    // 10 MB limit check
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image exceeds the 10 MB limit. Please select a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        onImageSelected(e.target.result);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file. Please try another photo.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full space-y-3">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {image ? (
        // Preview Active
        <div className="relative rounded-2xl overflow-hidden border border-canvas-dark bg-white shadow-sm aspect-[3/4] max-h-[500px] w-full flex items-center justify-center">
          <img
            src={image}
            alt="Uploaded person preview"
            className="w-full h-full object-cover"
          />

          {/* Action Overlay */}
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/90 backdrop-blur shadow-sm text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Replace</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onImageRemoved}
              className="bg-white/90 hover:bg-red-50 hover:text-red-600 backdrop-blur shadow-sm text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="absolute bottom-4 left-4 right-4 bg-charcoal/80 backdrop-blur text-canvas text-xs px-3.5 py-2 rounded-xl flex items-center space-x-2">
            <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Photo ready for try-on preview</span>
          </div>
        </div>
      ) : (
        // Dropzone
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-4 aspect-[4/3] sm:aspect-[3/4] max-h-[460px] ${
            isDragOver
              ? 'border-accent bg-accent-subtle/50 scale-[0.99]'
              : 'border-canvas-dark hover:border-charcoal/40 bg-white/70 hover:bg-white'
          }`}
        >
          <div className="w-14 h-14 rounded-full bg-canvas-subtle border border-canvas-dark flex items-center justify-center text-charcoal shadow-xs">
            <Upload className="w-6 h-6 text-accent" />
          </div>

          <div className="space-y-1.5 max-w-xs">
            <p className="font-serif text-lg font-medium text-charcoal">
              Upload Your Photograph
            </p>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Drag & drop your upper-body portrait here, or click to browse files.
            </p>
          </div>

          <Button type="button" variant="outline" size="sm" className="pointer-events-none mt-2">
            Select Photo from Device
          </Button>
        </div>
      )}

      {uploadError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
};
