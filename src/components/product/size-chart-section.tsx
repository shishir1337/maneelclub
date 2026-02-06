"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Ruler, ChevronDown, ChevronUp } from "lucide-react";

interface SizeChartRow {
  size: string;
  measurements: string[];
}

interface SizeChart {
  headers: string[];
  rows: SizeChartRow[];
}

interface SizeChartSectionProps {
  sizeChart: SizeChart | null;
}

// Default size chart if none provided
const defaultSizeChart: SizeChart = {
  headers: ["Size", "Chest (in)", "Length (in)", "Shoulder (in)"],
  rows: [
    { size: "S", measurements: ["38", "26", "17"] },
    { size: "M", measurements: ["40", "27", "18"] },
    { size: "L", measurements: ["42", "28", "19"] },
    { size: "XL", measurements: ["44", "29", "20"] },
    { size: "XXL", measurements: ["46", "30", "21"] },
  ],
};

export function SizeChartSection({ sizeChart }: SizeChartSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const chart = sizeChart || defaultSizeChart;

  return (
    <div className="border rounded-lg overflow-hidden">
      <Button
        variant="ghost"
        className="w-full justify-between h-auto py-3 px-4 hover:bg-muted/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <Ruler className="h-4 w-4" />
          Size Guide
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
      {isOpen && (
        <div className="px-4 pb-4 pt-0 border-t">
          <Table>
            <TableHeader>
              <TableRow>
                {chart.headers.map((header, index) => (
                  <TableHead key={index} className="text-center">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {chart.rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell className="font-medium text-center">
                    {row.size}
                  </TableCell>
                  {row.measurements.map((measurement, cellIndex) => (
                    <TableCell key={cellIndex} className="text-center">
                      {measurement}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground mt-4">
            * Measurements are approximate and may vary slightly.
          </p>
        </div>
      )}
    </div>
  );
}
