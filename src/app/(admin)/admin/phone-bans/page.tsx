"use client";

import { useState, useEffect } from "react";
import { Ban, Loader2, Plus, ShieldOff, Phone } from "lucide-react";
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
import { getBannedPhones, banPhone, unbanPhone } from "@/actions/admin/phone-bans";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";

interface BannedPhoneRow {
  id: string;
  phoneNumber: string;
  reason: string | null;
  createdAt: Date;
}

export default function AdminPhoneBansPage() {
  const [list, setList] = useState<BannedPhoneRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [addPhone, setAddPhone] = useState("");
  const [addReason, setAddReason] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const result = await getBannedPhones();
      if (result.success && result.data) {
        setList(
          result.data.map((r) => ({
            id: r.id,
            phoneNumber: r.phoneNumber,
            reason: r.reason,
            createdAt: r.createdAt,
          }))
        );
      } else {
        toast.error(result.error || "Failed to load banned phones");
      }
    } catch {
      toast.error("Failed to load banned phones");
    } finally {
      setLoading(false);
    }
  }

  async function handleBan() {
    const phone = addPhone.trim();
    if (!phone) {
      toast.error("Enter a phone number");
      return;
    }
    setAddSubmitting(true);
    try {
      const result = await banPhone(phone, addReason.trim() || undefined);
      if (result.success) {
        toast.success(`Phone banned: ${result.normalized ?? phone}`);
        setAddPhone("");
        setAddReason("");
        load();
      } else {
        toast.error(result.error || "Failed to ban phone");
      }
    } catch {
      toast.error("Failed to ban phone");
    } finally {
      setAddSubmitting(false);
    }
  }

  async function handleUnban(phoneNumber: string) {
    setActionLoading(phoneNumber);
    try {
      const result = await unbanPhone(phoneNumber);
      if (result.success) {
        toast.success("Phone unbanned");
        setList((prev) => prev.filter((r) => r.phoneNumber !== phoneNumber));
      } else {
        toast.error(result.error || "Failed to unban phone");
      }
    } catch {
      toast.error("Failed to unban phone");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Phone Bans</h1>
        <p className="text-muted-foreground">
          Block phone numbers from placing orders. Accepts any format: 01730285500, 8801730285500, +8801730285500.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5" />
            Ban phone number
          </CardTitle>
          <CardDescription>
            Enter any Bangladesh mobile number format. It will be normalized and stored as 01XXXXXXXXX.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              placeholder="e.g. 01730285500 or +8801730285500"
              value={addPhone}
              onChange={(e) => setAddPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleBan()}
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Input
              id="reason"
              placeholder="e.g. Repeated fake orders"
              value={addReason}
              onChange={(e) => setAddReason(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleBan()}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleBan} disabled={addSubmitting}>
              {addSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Ban Phone
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Banned phone numbers
          </CardTitle>
          <CardDescription>{list.length} number(s) banned</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton />
          ) : list.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No banned phone numbers. Add a number above to block it from placing orders.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phone number</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="hidden sm:table-cell">Banned at</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono">{row.phoneNumber}</TableCell>
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
                          onClick={() => handleUnban(row.phoneNumber)}
                          disabled={actionLoading === row.phoneNumber}
                        >
                          {actionLoading === row.phoneNumber ? (
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
