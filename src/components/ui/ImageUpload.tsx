'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
}

export default function ImageUpload({ value, onChange, folder = 'prendas' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      setError('La imagen debe ser menor a 5MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('cosefy-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('cosefy-images')
        .getPublicUrl(filePath);

      onChange(urlData.publicUrl);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    try {
      // Extract path from URL
      const urlParts = value.split('/');
      const fileName = urlParts.slice(-2).join('/');
      
      await supabase.storage
        .from('cosefy-images')
        .remove([fileName]);

      onChange('');
    } catch (err) {
      console.error('Remove error:', err);
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
          <img
            src={value}
            alt="Uploaded"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg",
            "flex flex-col items-center justify-center gap-2",
            "text-gray-text hover:border-gold hover:text-gold transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {uploading ? (
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Upload className="w-6 h-6" />
              <span className="text-xs">Subir foto</span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
