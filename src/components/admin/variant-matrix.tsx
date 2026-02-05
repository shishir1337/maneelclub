"use client";

import { useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SelectedValue {
  id: string;
  value: string;
  displayValue: string;
  metadata?: { hex?: string } | null;
}

interface SelectedAttribute {
  attributeId: string;
  attributeName: string;
  attributeSlug: string;
  values: SelectedValue[];
}

interface VariantStock {
  // Key is combination of attribute value IDs joined by "-"
  [key: string]: {
    stock: number;
    sku?: string;
    price?: number;
  };
}

interface VariantMatrixProps {
  selectedAttributes: SelectedAttribute[];
  variantStocks: VariantStock;
  onVariantStocksChange: (stocks: VariantStock) => void;
}

// Helper to generate all combinations of attribute values
function generateCombinations(
  attributes: SelectedAttribute[]
): { key: string; values: SelectedValue[]; labels: string[] }[] {
  if (attributes.length === 0) return [];

  const attributesWithValues = attributes.filter((a) => a.values.length > 0);
  if (attributesWithValues.length === 0) return [];

  // Generate cartesian product
  function cartesian(arrays: SelectedValue[][]): SelectedValue[][] {
    if (arrays.length === 0) return [[]];
    if (arrays.length === 1) return arrays[0].map((v) => [v]);

    const [first, ...rest] = arrays;
    const restCombinations = cartesian(rest);

    const result: SelectedValue[][] = [];
    for (const value of first) {
      for (const combination of restCombinations) {
        result.push([value, ...combination]);
      }
    }
    return result;
  }

  const valueArrays = attributesWithValues.map((a) => a.values);
  const combinations = cartesian(valueArrays);

  return combinations.map((combo) => ({
    key: combo.map((v) => v.id).join("-"),
    values: combo,
    labels: combo.map((v) => v.displayValue),
  }));
}

export function VariantMatrix({
  selectedAttributes,
  variantStocks,
  onVariantStocksChange,
}: VariantMatrixProps) {
  // Generate all variant combinations
  const combinations = useMemo(
    () => generateCombinations(selectedAttributes),
    [selectedAttributes]
  );

  // Initialize stock for new combinations
  useEffect(() => {
    const newStocks = { ...variantStocks };
    let hasChanges = false;

    for (const combo of combinations) {
      if (!newStocks[combo.key]) {
        newStocks[combo.key] = { stock: 0 };
        hasChanges = true;
      }
    }

    // Remove old combinations that no longer exist
    for (const key of Object.keys(newStocks)) {
      if (!combinations.some((c) => c.key === key)) {
        delete newStocks[key];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      onVariantStocksChange(newStocks);
    }
  }, [combinations, variantStocks, onVariantStocksChange]);

  function handleStockChange(key: string, stock: number) {
    onVariantStocksChange({
      ...variantStocks,
      [key]: {
        ...variantStocks[key],
        stock: Math.max(0, stock),
      },
    });
  }

  function handleSkuChange(key: string, sku: string) {
    onVariantStocksChange({
      ...variantStocks,
      [key]: {
        ...variantStocks[key],
        sku: sku || undefined,
      },
    });
  }

  function handlePriceChange(key: string, price: number) {
    onVariantStocksChange({
      ...variantStocks,
      [key]: {
        ...variantStocks[key],
        price: price > 0 ? price : undefined,
      },
    });
  }

  function handleBulkStockChange(stock: number) {
    const newStocks: VariantStock = {};
    for (const combo of combinations) {
      newStocks[combo.key] = {
        ...variantStocks[combo.key],
        stock: Math.max(0, stock),
      };
    }
    onVariantStocksChange(newStocks);
  }

  // Get attributes with values for header
  const attributesWithValues = selectedAttributes.filter(
    (a) => a.values.length > 0
  );

  if (attributesWithValues.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>Select attribute values above to generate variants.</p>
        </CardContent>
      </Card>
    );
  }

  if (combinations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>No variants to display.</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate total stock
  const totalStock = Object.values(variantStocks).reduce(
    (sum, v) => sum + (v?.stock || 0),
    0
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Variant Stock</CardTitle>
            <CardDescription>
              {combinations.length} variants generated from your attribute selections
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-base">
            Total: {totalStock} units
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Bulk stock setter */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b">
          <Label className="text-sm font-medium">Set all stock to:</Label>
          <Input
            type="number"
            min="0"
            className="w-24"
            placeholder="0"
            onBlur={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value)) {
                handleBulkStockChange(value);
                e.target.value = "";
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const value = parseInt((e.target as HTMLInputElement).value);
                if (!isNaN(value)) {
                  handleBulkStockChange(value);
                  (e.target as HTMLInputElement).value = "";
                }
              }
            }}
          />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {attributesWithValues.map((attr) => (
                  <TableHead key={attr.attributeId}>{attr.attributeName}</TableHead>
                ))}
                <TableHead className="w-[120px]">Stock</TableHead>
                <TableHead className="w-[130px]">Sale price (BDT)</TableHead>
                <TableHead className="w-[150px]">SKU (Optional)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {combinations.map((combo) => {
                const stock = variantStocks[combo.key]?.stock ?? 0;
                const sku = variantStocks[combo.key]?.sku ?? "";
                const price = variantStocks[combo.key]?.price ?? "";

                return (
                  <TableRow key={combo.key}>
                    {combo.values.map((value, idx) => {
                      const attr = attributesWithValues[idx];
                      const isColor = attr?.attributeSlug === "color";

                      return (
                        <TableCell key={value.id}>
                          <div className="flex items-center gap-2">
                            {isColor && value.metadata?.hex && (
                              <span
                                className="w-4 h-4 rounded-full border flex-shrink-0"
                                style={{ backgroundColor: value.metadata.hex }}
                              />
                            )}
                            <span>{value.displayValue}</span>
                          </div>
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={stock}
                        onChange={(e) =>
                          handleStockChange(combo.key, parseInt(e.target.value) || 0)
                        }
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={price}
                        onChange={(e) =>
                          handlePriceChange(combo.key, parseFloat(e.target.value) || 0)
                        }
                        placeholder="Same as product"
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={sku}
                        onChange={(e) => handleSkuChange(combo.key, e.target.value)}
                        placeholder="Auto-generated"
                        className="w-full"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
