"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  getAdminHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  reorderHeroSlides,
  type HeroSlideAdmin,
} from "@/actions/hero-slides";
import { ImageUploader } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  ImageIcon,
} from "lucide-react";

export default function AdminHeroPage() {
  const [slides, setSlides] = useState<HeroSlideAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlideAdmin | null>(null);
  const [deleteSlide, setDeleteSlide] = useState<HeroSlideAdmin | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state for add/edit
  const [formImage, setFormImage] = useState("");
  const [formAlt, setFormAlt] = useState("");
  const [formLink, setFormLink] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    loadSlides();
  }, []);

  async function loadSlides() {
    setLoading(true);
    const result = await getAdminHeroSlides();
    if (result.success && result.data) setSlides(result.data);
    else toast.error(result.error || "Failed to load slides");
    setLoading(false);
  }

  function openAdd() {
    setEditingSlide(null);
    setFormImage("");
    setFormAlt("");
    setFormLink("");
    setFormIsActive(true);
    setDialogOpen(true);
  }

  function openEdit(slide: HeroSlideAdmin) {
    setEditingSlide(slide);
    setFormImage(slide.image);
    setFormAlt(slide.alt);
    setFormLink(slide.link ?? "");
    setFormIsActive(slide.isActive);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formImage.trim()) {
      toast.error("Image is required");
      return;
    }
    setSaving(true);
    try {
      if (editingSlide) {
        const result = await updateHeroSlide(editingSlide.id, {
          image: formImage.trim(),
          alt: formAlt.trim(),
          link: formLink.trim() || null,
          isActive: formIsActive,
        });
        if (result.success) {
          toast.success("Slide updated");
          setDialogOpen(false);
          loadSlides();
        } else toast.error(result.error);
      } else {
        const result = await createHeroSlide({
          image: formImage.trim(),
          alt: formAlt.trim(),
          link: formLink.trim() || null,
        });
        if (result.success) {
          toast.success("Slide added");
          setDialogOpen(false);
          loadSlides();
        } else toast.error(result.error);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteSlide) return;
    setDeleting(true);
    try {
      const result = await deleteHeroSlide(deleteSlide.id);
      if (result.success) {
        toast.success("Slide deleted");
        setDeleteSlide(null);
        loadSlides();
      } else toast.error(result.error);
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleActive(slide: HeroSlideAdmin) {
    const result = await updateHeroSlide(slide.id, { isActive: !slide.isActive });
    if (result.success) {
      toast.success(slide.isActive ? "Slide hidden" : "Slide visible");
      loadSlides();
    } else toast.error(result.error);
  }

  async function moveSlide(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;
    const reordered = [...slides];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    const orderedIds = reordered.map((s) => s.id);
    const result = await reorderHeroSlides(orderedIds);
    if (result.success) {
      toast.success("Order updated");
      loadSlides();
    } else toast.error(result.error);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 flex gap-4">
                <Skeleton className="h-20 w-32 shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Hero Slider</h1>
          <p className="text-muted-foreground">
            Manage the homepage hero carousel. Order and visibility apply on the site immediately.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Slide
        </Button>
      </div>

      {slides.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No slides yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Add slides to show on the homepage hero carousel.
            </p>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Slide
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {slides.map((slide, index) => (
            <Card key={slide.id} className={!slide.isActive ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="relative w-28 h-16 sm:w-36 sm:h-20 rounded overflow-hidden bg-muted shrink-0">
                    <Image
                      src={slide.image}
                      alt={slide.alt || "Slide"}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{slide.alt || "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {slide.link || "No link"}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Switch
                        checked={slide.isActive}
                        onCheckedChange={() => handleToggleActive(slide)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {slide.isActive ? "Visible" : "Hidden"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => moveSlide(index, "up")}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => moveSlide(index, "down")}
                    disabled={index === slides.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(slide)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteSlide(slide)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSlide ? "Edit Slide" : "Add Slide"}</DialogTitle>
            <DialogDescription>
              Upload a slide image, add alt text and optional link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Upload image</Label>
              <ImageUploader
                images={formImage ? [formImage] : []}
                maxImages={1}
                onChange={(urls) => setFormImage(urls[0] ?? "")}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Or paste image URL</Label>
              <Input
                placeholder="/uploads/xxx.jpg or /sliderimage.png"
                value={formImage}
                onChange={(e) => setFormImage(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Alt text (accessibility)</Label>
              <Input
                placeholder="Brief description of the slide"
                value={formAlt}
                onChange={(e) => setFormAlt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Link URL (optional)</Label>
              <Input
                placeholder="/product-category/polo or https://..."
                value={formLink}
                onChange={(e) => setFormLink(e.target.value)}
              />
            </div>
            {editingSlide && (
              <div className="flex items-center gap-2">
                <Switch
                  id="form-active"
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                />
                <Label htmlFor="form-active">Visible on homepage</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingSlide ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteSlide} onOpenChange={() => !deleting && setDeleteSlide(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete slide?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the slide from the hero carousel. You can add it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
