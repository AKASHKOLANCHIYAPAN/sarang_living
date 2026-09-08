'use client';

import { useState, useRef, useCallback } from 'react';
import { UploadCloud, X, ImageIcon } from 'lucide-react';
import { getAssetPath } from '@/lib/utils';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export default function ImageUploader({ images, onChange, maxImages = 10 }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      setError(`Maximum ${maxImages} images allowed.`);
      return;
    }

    const filesToUpload = fileArray.slice(0, remaining);
    setUploading(true);
    setError(null);
    setUploadProgress(5);

    const urls: string[] = [];
    const errs: string[] = [];
    const totalFiles = filesToUpload.length;

    try {
      for (let i = 0; i < totalFiles; i++) {
        const file = filesToUpload[i];

        // Client-side 5MB validation
        if (file.size > 5 * 1024 * 1024) {
          errs.push(`"${file.name}" exceeds the 5MB size limit.`);
          continue;
        }

        const formData = new FormData();
        formData.append('files', file);

        const currentProgress = Math.round(10 + ((i + 0.5) / totalFiles) * 80);
        setUploadProgress(currentProgress);

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        // Safe response parsing to prevent 'Unexpected token R' on 413 / HTML response
        const contentType = res.headers.get('content-type') || '';
        let data: any = {};

        if (contentType.includes('application/json')) {
          data = await res.json();
        } else {
          const textResponse = await res.text();
          if (res.status === 413 || textResponse.toLowerCase().includes('entity too large')) {
            errs.push(`"${file.name}" exceeds server payload limit. Please use an image under 5MB.`);
          } else {
            errs.push(`"${file.name}" failed to upload (Server error ${res.status}).`);
          }
          continue;
        }

        if (!res.ok || !data.success) {
          errs.push(data.error || `Upload failed for "${file.name}".`);
        } else if (data.urls && data.urls.length > 0) {
          urls.push(...data.urls);
        }

        if (data.errors && data.errors.length > 0) {
          errs.push(...data.errors);
        }
      }

      if (urls.length > 0) {
        onChange([...images, ...urls]);
      }

      if (errs.length > 0) {
        setError(errs.join(' '));
      }

      setUploadProgress(100);
    } catch (err: any) {
      setError(err.message || 'Upload failed.');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  }, [images, maxImages, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleUpload(e.dataTransfer.files);
    }
  }, [handleUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleUpload(e.target.files);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [handleUpload]);

  const removeImage = useCallback((index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  }, [images, onChange]);

  return (
    <div>
      {/* Upload Zone */}
      <div
        className={`admin-image-upload-zone ${dragActive ? 'drag-active' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload product images"
      >
        <UploadCloud size={32} className="upload-icon" />
        <p>
          {uploading
            ? 'Uploading images...'
            : 'Click to browse or drag & drop images here'}
        </p>
        <span className="upload-hint">
          JPG, PNG, WEBP — Max 5MB each — Up to {maxImages} images
        </span>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="admin-image-upload-progress">
          <div
            className="admin-image-upload-progress-bar"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="admin-form-error" style={{ marginTop: '8px' }}>
          {error}
        </p>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="admin-image-preview-grid">
          {images.map((imgUrl, index) => (
            <div key={`${imgUrl}-${index}`} className="admin-image-preview-item">
              <img
                src={getAssetPath(imgUrl)}
                alt={`Product image ${index + 1}`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/products/SL001.png';
                }}
              />
              <button
                type="button"
                className="admin-image-preview-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
                aria-label={`Remove image ${index + 1}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
