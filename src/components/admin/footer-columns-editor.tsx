"use client";

import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FooterColumn } from "@/lib/settings-defaults";
import { LinkListEditor } from "./link-list-editor";

export interface FooterColumnsEditorProps {
  columns: FooterColumn[];
  onChange: (columns: FooterColumn[]) => void;
}

/**
 * Editor for the footer link columns: each column has a title and its own link list.
 * Columns can be added, removed, renamed and reordered. Stateless like LinkListEditor.
 */
export function FooterColumnsEditor({ columns, onChange }: FooterColumnsEditorProps) {
  function addColumn() {
    onChange([...columns, { title: "New Column", links: [] }]);
  }

  function removeColumn(index: number) {
    onChange(columns.filter((_, i) => i !== index));
  }

  function moveColumn(index: number, dir: "up" | "down") {
    const target = dir === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= columns.length) return;
    const next = [...columns];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function updateColumn(index: number, patch: Partial<FooterColumn>) {
    onChange(columns.map((column, i) => (i === index ? { ...column, ...patch } : column)));
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {columns.map((column, index) => (
          <div key={index} className="rounded-lg border p-3 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => moveColumn(index, "up")}
                  disabled={index === 0}
                  aria-label="Move column up"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => moveColumn(index, "down")}
                  disabled={index === columns.length - 1}
                  aria-label="Move column down"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => removeColumn(index)}
                  aria-label="Remove column"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Column title</Label>
                <Input
                  value={column.title}
                  onChange={(e) => updateColumn(index, { title: e.target.value })}
                  placeholder="e.g. Shop"
                />
              </div>
            </div>
            <LinkListEditor
              items={column.links}
              onChange={(links) => updateColumn(index, { links })}
              addLabel="Add link"
            />
          </div>
        ))}
        {columns.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No link columns. The footer will show only the brand and contact blocks.
          </p>
        )}
      </div>
      <Button type="button" variant="outline" onClick={addColumn} className="w-full sm:w-auto">
        <Plus className="h-4 w-4 mr-2" />
        Add column
      </Button>
    </div>
  );
}
