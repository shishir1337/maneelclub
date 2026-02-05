"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Ruler } from "lucide-react";

interface SizeChartRow {
  size: string;
  measurements: string[];
}

interface SizeChart {
  headers: string[];
  rows: SizeChartRow[];
}

interface SizeChartDialogProps {
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

export function SizeChartDialog({ sizeChart }: SizeChartDialogProps) {
  const chart = sizeChart || defaultSizeChart;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className="h-auto p-0 text-primary">
          <Ruler className="h-4 w-4 mr-1" />
          Size Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Size Guide</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
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
      </DialogContent>
    </Dialog>
  );
}
