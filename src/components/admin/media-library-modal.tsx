"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Search, Loader2, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MediaFile {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  path: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  width?: number;
  height?: number;
  type?: string;
}

interface MediaLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (urls: string[]) => void;
  maxSelection?: number;
  currentImages?: string[];
}

export function MediaLibraryModal({
  open,
  onOpenChange,
  onSelect,
  maxSelection = 10,
  currentImages = [],
}: MediaLibraryModalProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limit = 20;

  const fetchFiles = useCallback(
    async (search: string = "", offset: number = 0, reset: boolean = false) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
          skip: offset.toString(),
        });

        if (search.trim()) {
          params.append("search", search.trim());
        }

        const response = await fetch(`/api/media-library?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch media library");
        }

        if (reset) {
          setFiles(data.files || []);
        } else {
          setFiles((prev) => [...prev, ...(data.files || [])]);
        }

        setHasMore(data.hasMore || false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load media library");
        console.error("Media library fetch error:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (open) {
      setSkip(0);
      setSelectedUrls(new Set());
      fetchFiles(searchQuery, 0, true);
    }
  }, [open, searchQuery, fetchFiles]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSkip(0);
    fetchFiles(query, 0, true);
  };

  const handleLoadMore = () => {
    const newSkip = skip + limit;
    setSkip(newSkip);
    fetchFiles(searchQuery, newSkip, false);
  };

  const toggleSelection = (url: string) => {
    setSelectedUrls((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(url)) {
        newSet.delete(url);
      } else {
        // Check max selection limit
        const remaining = maxSelection - currentImages.length;
        if (newSet.size >= remaining) {
          return prev; // Don't add if limit reached
        }
        newSet.add(url);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    const urls = Array.from(selectedUrls);
    onSelect(urls);
    onOpenChange(false);
    setSelectedUrls(new Set());
    setSearchQuery("");
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedUrls(new Set());
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
          <DialogDescription>
            Select images from your media library. {maxSelection > 0 && `You can select up to ${maxSelection - currentImages.length} more.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Image Grid */}
          <div className="flex-1 overflow-y-auto border rounded-md p-4 bg-muted/30">
            {loading && files.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No images found.</p>
                {searchQuery && <p className="text-sm mt-2">Try a different search term.</p>}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {files.map((file) => {
                  const isSelected = selectedUrls.has(file.url);
                  const canSelect = maxSelection === 0 || selectedUrls.size + currentImages.length < maxSelection;

                  return (
                    <div
                      key={file.id}
                      className={cn(
                        "relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
                        isSelected
                          ? "border-primary ring-2 ring-primary ring-offset-2"
                          : "border-border hover:border-primary/50",
                        !canSelect && !isSelected && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => {
                        if (canSelect || isSelected) {
                          toggleSelection(file.url);
                        }
                      }}
                    >
                      <div className="aspect-square relative bg-muted">
                        <Image
                          src={file.thumbnailUrl || file.url}
                          alt={file.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          unoptimized
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="bg-primary text-primary-foreground rounded-full p-2">
                              <Check className="h-4 w-4" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-2 bg-background">
                        <p className="text-xs font-medium truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {file.width && file.height ? `${file.width}×${file.height}` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Load More */}
            {hasMore && !loading && (
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}

            {loading && files.length > 0 && (
              <div className="mt-4 text-center">
                <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedUrls.size > 0 && (
                <span>{selectedUrls.size} image{selectedUrls.size !== 1 ? "s" : ""} selected</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={selectedUrls.size === 0}>
                Add Selected ({selectedUrls.size})
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
