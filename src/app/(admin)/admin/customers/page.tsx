"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, MoreHorizontal, Mail, ShoppingBag, Users, UserCheck, Ban, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice, formatDate } from "@/lib/format";
import { getAdminCustomers, getCustomerStats, banUser, unbanUser } from "@/actions/admin/customers";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";

interface Customer {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  role: string;
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
  orderCount: number;
  totalSpent: number;
}

interface CustomerStats {
  totalCustomers: number;
  thisMonthCustomers: number;
  lastMonthCustomers: number;
  customersWithOrders: number;
  conversionRate: number;
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [banDialogUser, setBanDialogUser] = useState<Customer | null>(null);
  const [banReason, setBanReason] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [customersResult, statsResult] = await Promise.all([
        getAdminCustomers(),
        getCustomerStats(),
      ]);

      if (customersResult.success && customersResult.data) {
        setCustomers(customersResult.data.customers);
        setTotal(customersResult.data.total);
      } else {
        toast.error(customersResult.error || "Failed to load customers");
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      toast.error("Failed to load customer data");
    } finally {
      setLoading(false);
    }
  }

  async function handleBan(userId: string, reason?: string) {
    setActionLoading(userId);
    setBanDialogUser(null);
    setBanReason("");
    try {
      const result = await banUser(userId, { banReason: reason || undefined });
      if (result.success) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === userId
              ? { ...c, banned: true, banReason: reason || null, banExpires: null }
              : c
          )
        );
        toast.success("User banned");
      } else {
        toast.error(result.error || "Failed to ban user");
      }
    } catch (error) {
      toast.error("Failed to ban user");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUnban(userId: string) {
    setActionLoading(userId);
    try {
      const result = await unbanUser(userId);
      if (result.success) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === userId
              ? { ...c, banned: false, banReason: null, banExpires: null }
              : c
          )
        );
        toast.success("User unbanned");
      } else {
        toast.error(result.error || "Failed to unban user");
      }
    } catch (error) {
      toast.error("Failed to unban user");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSearch(query: string) {
    setSearchQuery(query);
    
    if (query.length === 0) {
      loadData();
      return;
    }

    if (query.length < 2) return;

    try {
      const result = await getAdminCustomers({ search: query });
      if (result.success && result.data) {
        setCustomers(result.data.customers);
        setTotal(result.data.total);
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-28 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-0">
            <TableSkeleton columns={5} rows={8} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="text-muted-foreground">Manage your customer base</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.thisMonthCustomers} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Buyers</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.customersWithOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.conversionRate}% conversion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisMonthCustomers}</div>
              <p className="text-xs text-muted-foreground">
                New registrations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Month</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lastMonthCustomers}</div>
              <p className="text-xs text-muted-foreground">
                New registrations
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>{total} customers found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium hidden md:table-cell">Email</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Orders</th>
                  <th className="pb-3 font-medium hidden sm:table-cell">Total Spent</th>
                  <th className="pb-3 font-medium hidden lg:table-cell">Joined</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b last:border-0">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(customer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{customer.name || "No name"}</p>
                          <p className="text-sm text-muted-foreground md:hidden">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 hidden md:table-cell">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3" />
                        {customer.email}
                      </div>
                    </td>
                    <td className="py-4">
                      {customer.banned ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950/60 dark:text-red-400"
                          title={customer.banReason || "Banned"}
                        >
                          <Ban className="h-3 w-3" />
                          Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950/60 dark:text-green-400">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1">
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        {customer.orderCount}
                      </div>
                    </td>
                    <td className="py-4 hidden sm:table-cell font-medium">
                      {formatPrice(customer.totalSpent)}
                    </td>
                    <td className="py-4 hidden lg:table-cell text-sm text-muted-foreground">
                      {formatDate(new Date(customer.createdAt))}
                    </td>
                    <td className="py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/orders?customer=${customer.id}`}>
                              View Orders
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={`mailto:${customer.email}`}>
                              Send Email
                            </a>
                          </DropdownMenuItem>
                          {customer.role !== "ADMIN" && (
                            <>
                              <DropdownMenuSeparator />
                              {customer.banned ? (
                                <DropdownMenuItem
                                  onClick={() => handleUnban(customer.id)}
                                  disabled={actionLoading === customer.id}
                                  className="text-green-600 focus:text-green-600"
                                >
                                  {actionLoading === customer.id ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : null}
                                  Unban user
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => setBanDialogUser(customer)}
                                  disabled={actionLoading === customer.id}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Ban user
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {customers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No customers found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ban user dialog */}
      <Dialog open={!!banDialogUser} onOpenChange={(open) => !open && setBanDialogUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ban user</DialogTitle>
            <DialogDescription>
              Ban {banDialogUser?.name || banDialogUser?.email}? They will not be
              able to sign in, and all their sessions will be revoked.
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-sm text-muted-foreground">
              Reason (optional)
            </label>
            <Input
              placeholder="e.g., Spamming, Terms violation"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogUser(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={actionLoading !== null}
              onClick={() =>
                banDialogUser && handleBan(banDialogUser.id, banReason || undefined)
              }
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Ban className="h-4 w-4 mr-2" />
              )}
              Ban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
