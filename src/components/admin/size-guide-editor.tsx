"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Ruler } from "lucide-react";

export interface SizeChartValue {
  headers: string[];
  rows: { size: string; measurements: string[] }[];
}

interface SizeGuideEditorProps {
  value: SizeChartValue | null;
  onChange: (value: SizeChartValue | null) => void;
}

const DEFAULT_HEADERS = ["Size", "Chest (in)", "Length (in)", "Shoulder (in)"];

export function SizeGuideEditor({ value, onChange }: SizeGuideEditorProps) {
  const headers = value?.headers?.length ? value.headers : DEFAULT_HEADERS;
  const rows = value?.rows ?? [];
  const measurementCount = Math.max(0, headers.length - 1); // first column is Size

  function setHeaders(newHeaders: string[]) {
    if (newHeaders.length < 2) return;
    const newRows = rows.map((r) => ({
      size: r.size,
      measurements: r.measurements.slice(0, newHeaders.length - 1),
    }));
    onChange({ headers: newHeaders, rows: newRows });
  }

  function setRows(newRows: { size: string; measurements: string[] }[]) {
    onChange({ headers, rows: newRows });
  }

  function addHeader() {
    setHeaders([...headers, `Col ${headers.length + 1}`]);
  }

  function removeHeader(index: number) {
    if (index === 0 || headers.length <= 2) return;
    const newHeaders = headers.filter((_, i) => i !== index);
    const newRows = rows.map((r) => ({
      size: r.size,
      measurements: r.measurements.filter((_, i) => i !== index - 1),
    }));
    onChange({ headers: newHeaders, rows: newRows });
  }

  function updateHeader(index: number, label: string) {
    const newHeaders = [...headers];
    newHeaders[index] = label;
    setHeaders(newHeaders);
  }

  function addRow() {
    setRows([
      ...rows,
      { size: "", measurements: Array(measurementCount).fill("") },
    ]);
  }

  function removeRow(index: number) {
    setRows(rows.filter((_, i) => i !== index));
  }

  function updateRowSize(index: number, size: string) {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], size };
    setRows(newRows);
  }

  function updateRowMeasurement(rowIndex: number, colIndex: number, val: string) {
    const newRows = [...rows];
    const meas = [...(newRows[rowIndex].measurements ?? [])];
    while (meas.length <= colIndex) meas.push("");
    meas[colIndex] = val;
    newRows[rowIndex] = { ...newRows[rowIndex], measurements: meas };
    setRows(newRows);
  }

  const isEmpty = !value || (headers.length <= 1 && rows.length === 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ruler className="h-5 w-5" />
          Size Guide
        </CardTitle>
        <CardDescription>
          Optional. Add a size chart table shown on the product page. Leave empty to hide.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Column headers */}
        <div className="space-y-2">
          <Label>Table columns</Label>
          <div className="flex flex-wrap gap-2 items-center">
            {headers.map((h, i) => (
              <div key={i} className="flex items-center gap-1">
                <Input
                  value={h}
                  onChange={(e) => updateHeader(i, e.target.value)}
                  placeholder={i === 0 ? "Size" : "Column name"}
                  className="w-28"
                />
                {i > 0 && headers.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeHeader(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addHeader}>
              <Plus className="h-4 w-4 mr-1" />
              Column
            </Button>
          </div>
        </div>

        {/* Rows */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Rows</Label>
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-4 w-4 mr-1" />
              Add row
            </Button>
          </div>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 border rounded-md text-center">
              No rows. Add rows to build the size chart.
            </p>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((h, i) => (
                      <TableHead key={i} className="text-center min-w-[80px]">
                        {h}
                      </TableHead>
                    ))}
                    <TableHead className="w-[60px]"> </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      <TableCell className="p-1">
                        <Input
                          value={row.size}
                          onChange={(e) => updateRowSize(rowIndex, e.target.value)}
                          placeholder="S"
                          className="h-8 text-center"
                        />
                      </TableCell>
                      {Array.from({ length: measurementCount }).map((_, colIndex) => (
                        <TableCell key={colIndex} className="p-1">
                          <Input
                            value={row.measurements?.[colIndex] ?? ""}
                            onChange={(e) =>
                              updateRowMeasurement(rowIndex, colIndex, e.target.value)
                            }
                            className="h-8 text-center"
                          />
                        </TableCell>
                      ))}
                      <TableCell className="p-1 w-[60px]">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeRow(rowIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {!isEmpty && rows.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => onChange(null)}
          >
            Clear size guide
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
