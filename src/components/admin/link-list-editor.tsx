"use client";

import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LinkItem } from "@/lib/settings-defaults";

export interface LinkListEditorProps {
  items: LinkItem[];
  onChange: (items: LinkItem[]) => void;
  labelPlaceholder?: string;
  hrefPlaceholder?: string;
  /** Remove is disabled while the list has this many items or fewer. Default 0 (lists can be emptied). */
  minItems?: number;
  addLabel?: string;
  /** Item appended by the Add button. */
  newItem?: LinkItem;
}

/**
 * Editable list of { name, href } links with reorder / remove / add controls.
 * Stateless: every change is reported through onChange with a new array.
 */
export function LinkListEditor({
  items,
  onChange,
  labelPlaceholder = "e.g. Shop",
  hrefPlaceholder = "e.g. /shop or /product-category/slug",
  minItems = 0,
  addLabel = "Add link",
  newItem = { name: "New Link", href: "/" },
}: LinkListEditorProps) {
  function add() {
    onChange([...items, { ...newItem }]);
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function move(index: number, dir: "up" | "down") {
    const target = dir === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function updateField(index: number, field: "name" | "href", value: string) {
    onChange(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex flex-col sm:flex-row gap-2 p-3 rounded-lg border bg-muted/30"
          >
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => move(index, "up")}
                disabled={index === 0}
                aria-label="Move up"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => move(index, "down")}
                disabled={index === items.length - 1}
                aria-label="Move down"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => remove(index)}
                disabled={items.length <= minItems}
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Label</Label>
                <Input
                  value={item.name}
                  onChange={(e) => updateField(index, "name", e.target.value)}
                  placeholder={labelPlaceholder}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">URL</Label>
                <Input
                  value={item.href}
                  onChange={(e) => updateField(index, "href", e.target.value)}
                  placeholder={hrefPlaceholder}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" onClick={add} className="w-full sm:w-auto">
        <Plus className="h-4 w-4 mr-2" />
        {addLabel}
      </Button>
    </div>
  );
}
