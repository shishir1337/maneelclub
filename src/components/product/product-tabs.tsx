"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SizeChartRow {
  size: string;
  measurements: string[];
}

interface SizeChart {
  headers: string[];
  rows: SizeChartRow[];
}

interface ProductTabsProps {
  description: string | null;
  sizeChart: SizeChart | null;
}

const shippingInfo = `
**Dhaka City Home Delivery - ৳70**
Products are delivered via Cash on Delivery (COD) within Dhaka City Corporation areas.
After placing an order, you can pay the delivery person upon receiving the product.

**Return Policy:**
- Dhaka City: ৳70 return charge
- Outside Dhaka: ৳130 return charge

**Outside Dhaka - ৳130**
For orders outside Dhaka City Corporation, delivery charge is ৳130.
For customers with high cancellation rates or suspected fraud orders, advance booking payment of ৳130 delivery charge may be required.

**Delivery Time:**
- Dhaka City: 2-3 business days
- Outside Dhaka: 3-5 business days

*Note: Delivery may be delayed due to weather conditions, political situations, or technical issues.*
`;

export function ProductTabs({ description, sizeChart }: ProductTabsProps) {
  return (
    <Tabs defaultValue="description" className="w-full">
      <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
        <TabsTrigger
          value="description"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
        >
          Description
        </TabsTrigger>
        {sizeChart && (
          <TabsTrigger
            value="size-chart"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            Size Chart
          </TabsTrigger>
        )}
        <TabsTrigger
          value="shipping"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
        >
          Shipping & Delivery
        </TabsTrigger>
      </TabsList>

      <TabsContent value="description" className="mt-6">
        <div className="prose prose-sm max-w-none">
          {description ? (
            <div className="whitespace-pre-line text-muted-foreground">
              {description}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No description available for this product.
            </p>
          )}
        </div>
      </TabsContent>

      {sizeChart && (
        <TabsContent value="size-chart" className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                {sizeChart.headers.map((header, index) => (
                  <TableHead key={index} className="text-center">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sizeChart.rows.map((row, rowIndex) => (
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
        </TabsContent>
      )}

      <TabsContent value="shipping" className="mt-6">
        <div className="prose prose-sm max-w-none">
          <div className="space-y-4 text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                Dhaka City Home Delivery - ৳70
              </h4>
              <p>
                Products are delivered via Cash on Delivery (COD) within Dhaka City Corporation areas.
                After placing an order, you can pay the delivery person upon receiving the product.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                Outside Dhaka - ৳130
              </h4>
              <p>
                For orders outside Dhaka City Corporation, delivery charge is ৳130.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                Return Policy
              </h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Dhaka City: ৳70 return charge</li>
                <li>Outside Dhaka: ৳130 return charge</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                Delivery Time
              </h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Dhaka City: 2-3 business days</li>
                <li>Outside Dhaka: 3-5 business days</li>
              </ul>
              <p className="text-xs mt-2">
                *Note: Delivery may be delayed due to weather conditions, political situations, or technical issues.
              </p>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
