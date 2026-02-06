"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { X, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  images: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  compact?: boolean;
}

export function ImageUploader({
  images,
  onChange,
  maxImages = 10,
  compact = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileSelect(files: FileList | null) {
    if (!files?.length) return;
    const remaining = maxImages - images.length;
    if (remaining <= 0) return;

    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    const newUrls: string[] = [];

    for (const file of toUpload) {
      if (!file.type.startsWith("image/")) continue;
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.url) {
          newUrls.push(data.url);
        }
      } catch {
        // Skip failed uploads
      }
    }

    if (newUrls.length > 0) {
      onChange([...images, ...newUrls]);
    }
    setUploading(false);
  }

  function handleRemove(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  const canAdd = images.length < maxImages;

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {images.map((url, i) => (
          <div key={url} className="relative group">
            <div className="w-12 h-12 rounded overflow-hidden border bg-muted">
              <Image
                src={url}
                alt=""
                width={48}
                height={48}
                className="object-cover w-full h-full"
                unoptimized
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="absolute -top-1 -right-1 rounded-full bg-destructive text-destructive-foreground p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-12 h-12 rounded border-2 border-dashed flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFileSelect(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {images.map((url, i) => (
          <div key={url} className="relative group">
            <div className="w-24 h-24 rounded-lg overflow-hidden border bg-muted">
              <Image
                src={url}
                alt=""
                width={96}
                height={96}
                className="object-cover w-full h-full"
                unoptimized
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="absolute top-1 right-1 rounded-full bg-destructive text-destructive-foreground p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      {canAdd && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            "hover:border-primary hover:bg-muted/50",
            uploading && "opacity-60 pointer-events-none"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFileSelect(e.target.files);
              e.target.value = "";
            }}
          />
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Drag and drop or click to upload images
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG, WebP, GIF up to 5MB. Max {maxImages} images.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
