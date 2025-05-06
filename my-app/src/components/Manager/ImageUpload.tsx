import React, { useState, useRef } from 'react';
import { uploadProductImage, getProductImageUrl } from '../../hooks/useProducts';

interface ImageUploadProps {
  currentImageUrl: string | null;
  currentStoragePath: string | null;
  venueName: string;
  productName: string;
  onImageUploaded: (storagePath: string, publicUrl: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImageUrl,
  currentStoragePath,
  venueName,
  productName,
  onImageUploaded
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Basic validation
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('File size must be less than 5MB');
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload to Supabase Storage
      const storagePath = await uploadProductImage(file, venueName, productName);
      const publicUrl = getProductImageUrl(storagePath);
      
      // Notify parent component
      onImageUploaded(storagePath, publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Product Image
      </label>
      
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
        onClick={triggerFileInput}
      >
        {previewUrl ? (
          <div className="relative w-full">
            <img 
              src={previewUrl} 
              alt="Product" 
              className="mx-auto h-40 object-contain mb-2"
            />
            <p className="text-xs text-gray-500 text-center">Click to change image</p>
          </div>
        ) : (
          <div className="text-center">
            <svg 
              className="mx-auto h-12 w-12 text-gray-400" 
              stroke="currentColor" 
              fill="none" 
              viewBox="0 0 48 48" 
              aria-hidden="true"
            >
              <path 
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
                strokeWidth={2} 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
            <p className="mt-1 text-sm text-gray-500">
              {isUploading ? 'Uploading...' : 'Click to upload an image'}
            </p>
            <p className="mt-1 text-xs text-gray-400">PNG, JPG, GIF up to 5MB</p>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isUploading}
        />
      </div>
      
      {currentStoragePath && (
        <p className="text-xs text-gray-500 mt-1 truncate">
          Current path: {currentStoragePath}
        </p>
      )}
      
      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-indigo-600 h-2.5 rounded-full w-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload; 