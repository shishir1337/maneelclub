"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { X, Upload, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaLibraryModal } from "./media-library-modal";
import { Button } from "@/components/ui/button";

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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);

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

  function handleDragStart(e: React.DragEvent, index: number) {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }

  function handleDragLeave() {
    setDragOverIndex(null);
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newImages = [...images];
    const [draggedItem] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedItem);
    onChange(newImages);
    setDraggedIndex(null);
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }

  function handleFileDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  function handleMediaLibrarySelect(selectedUrls: string[]) {
    const remaining = maxImages - images.length;
    const toAdd = selectedUrls.slice(0, remaining);
    if (toAdd.length > 0) {
      onChange([...images, ...toAdd]);
    }
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
            {i === 0 && (
              <div className="absolute -top-1 -left-1 bg-primary text-primary-foreground text-[8px] font-semibold px-1 py-0.5 rounded">
                Thumbnail
              </div>
            )}
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="absolute -top-1 -right-1 rounded-full bg-destructive text-destructive-foreground p-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
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
      <MediaLibraryModal
        open={mediaLibraryOpen}
        onOpenChange={setMediaLibraryOpen}
        onSelect={handleMediaLibrarySelect}
        maxSelection={maxImages}
        currentImages={images}
      />
      <div className="flex flex-wrap gap-3 mb-3">
        {images.map((url, i) => (
          <div
            key={url}
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, i)}
            className={cn(
              "relative group cursor-move",
              draggedIndex === i && "opacity-50",
              dragOverIndex === i && "ring-2 ring-primary ring-offset-2"
            )}
          >
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
            {i === 0 && (
              <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-sm">
                Thumbnail
              </div>
            )}
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="absolute top-1 right-1 rounded-full bg-destructive text-destructive-foreground p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      {canAdd && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div
              onDrop={handleFileDrop}
              onDragOver={handleFileDragOver}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "flex-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
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
                    JPEG, PNG, WebP, GIF up to 10MB. Max {maxImages} images. The first image will be used as the product thumbnail.
                  </p>
                </>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMediaLibraryOpen(true)}
              disabled={uploading}
              className="shrink-0"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Media Library
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
