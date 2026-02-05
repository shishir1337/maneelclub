"use client";

import { useState } from "react";
import { Search, MoreHorizontal, Mail, Phone, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPrice, formatDate } from "@/lib/format";

// Mock customers data
const mockCustomers = [
  { 
    id: "1",
    name: "John Doe", 
    email: "john@example.com",
    phone: "01712345678",
    totalOrders: 5,
    totalSpent: 12500,
    lastOrder: new Date("2026-02-04"),
    status: "active"
  },
  { 
    id: "2",
    name: "Jane Smith", 
    email: "jane@example.com",
    phone: "01812345678",
    totalOrders: 3,
    totalSpent: 8900,
    lastOrder: new Date("2026-02-03"),
    status: "active"
  },
  { 
    id: "3",
    name: "Mike Wilson", 
    email: "mike@example.com",
    phone: "01912345678",
    totalOrders: 8,
    totalSpent: 25000,
    lastOrder: new Date("2026-02-01"),
    status: "active"
  },
  { 
    id: "4",
    name: "Sarah Brown", 
    email: "sarah@example.com",
    phone: "01612345678",
    totalOrders: 1,
    totalSpent: 650,
    lastOrder: new Date("2026-01-28"),
    status: "active"
  },
  { 
    id: "5",
    name: "Tom Davis", 
    email: "tom@example.com",
    phone: "01512345678",
    totalOrders: 2,
    totalSpent: 3600,
    lastOrder: new Date("2026-01-15"),
    status: "inactive"
  },
];

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
}

export default function AdminCustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = mockCustomers.filter((customer) => {
    return (
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="text-muted-foreground">Manage your customer base</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>{filteredCustomers.length} customers found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium hidden md:table-cell">Contact</th>
                  <th className="pb-3 font-medium">Orders</th>
                  <th className="pb-3 font-medium hidden sm:table-cell">Total Spent</th>
                  <th className="pb-3 font-medium hidden lg:table-cell">Last Order</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b last:border-0">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(customer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground md:hidden">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 hidden md:table-cell">
                      <div className="space-y-1">
                        <p className="text-sm flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </p>
                        <p className="text-sm flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </p>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1">
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        {customer.totalOrders}
                      </div>
                    </td>
                    <td className="py-4 hidden sm:table-cell font-medium">
                      {formatPrice(customer.totalSpent)}
                    </td>
                    <td className="py-4 hidden lg:table-cell text-sm text-muted-foreground">
                      {formatDate(customer.lastOrder)}
                    </td>
                    <td className="py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            View Orders
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            Send Email
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredCustomers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No customers found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
