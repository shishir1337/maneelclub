"use client";

import { useState, useEffect } from "react";
import { Ban, Loader2, Plus, ShieldOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getBannedIps, banIp, unbanIp } from "@/actions/admin/ip-bans";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";

interface BannedIpRow {
  id: string;
  ipAddress: string;
  reason: string | null;
  createdAt: Date;
}

export default function AdminIpBansPage() {
  const [list, setList] = useState<BannedIpRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [addIp, setAddIp] = useState("");
  const [addReason, setAddReason] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const result = await getBannedIps();
      if (result.success && result.data) {
        setList(
          result.data.map((r) => ({
            id: r.id,
            ipAddress: r.ipAddress,
            reason: r.reason,
            createdAt: r.createdAt,
          }))
        );
      } else {
        toast.error(result.error || "Failed to load banned IPs");
      }
    } catch {
      toast.error("Failed to load banned IPs");
    } finally {
      setLoading(false);
    }
  }

  async function handleBan() {
    const ip = addIp.trim();
    if (!ip) {
      toast.error("Enter an IP address");
      return;
    }
    setAddSubmitting(true);
    try {
      const result = await banIp(ip, addReason.trim() || undefined);
      if (result.success) {
        toast.success("IP banned");
        setAddIp("");
        setAddReason("");
        load();
      } else {
        toast.error(result.error || "Failed to ban IP");
      }
    } catch {
      toast.error("Failed to ban IP");
    } finally {
      setAddSubmitting(false);
    }
  }

  async function handleUnban(ipAddress: string) {
    setActionLoading(ipAddress);
    try {
      const result = await unbanIp(ipAddress);
      if (result.success) {
        toast.success("IP unbanned");
        setList((prev) => prev.filter((r) => r.ipAddress !== ipAddress));
      } else {
        toast.error(result.error || "Failed to unban IP");
      }
    } catch {
      toast.error("Failed to unban IP");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">IP Bans</h1>
        <p className="text-muted-foreground">
          Block IP addresses from placing orders. Banned IPs cannot checkout.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5" />
            Ban IP address
          </CardTitle>
          <CardDescription>
            Add an IP to prevent it from placing orders. Use IPv4 (e.g. 1.2.3.4) or IPv6.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="ip">IP address</Label>
            <Input
              id="ip"
              placeholder="e.g. 192.168.1.1"
              value={addIp}
              onChange={(e) => setAddIp(e.target.value)}
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Input
              id="reason"
              placeholder="e.g. Spam orders"
              value={addReason}
              onChange={(e) => setAddReason(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleBan} disabled={addSubmitting}>
              {addSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Ban IP
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Banned IPs</CardTitle>
          <CardDescription>{list.length} IP(s) banned</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton />
          ) : list.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No banned IPs. Add an IP above to block it from placing orders.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP address</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="hidden sm:table-cell">Banned at</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono">{row.ipAddress}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.reason || "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {formatDate(row.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnban(row.ipAddress)}
                          disabled={actionLoading === row.ipAddress}
                        >
                          {actionLoading === row.ipAddress ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <ShieldOff className="h-4 w-4 mr-1" />
                              Unban
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
