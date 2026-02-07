"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSettings, updateSettings } from "@/actions/admin/settings";
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS as unknown as Record<string, string>);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setIsLoading(true);
    try {
      const result = await getSettings();
      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        toast.error(result.error || "Failed to load settings");
      }
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  }

  function handleChange(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }

  function handleSwitchChange(key: string, checked: boolean) {
    setSettings((prev) => ({ ...prev, [key]: checked ? "true" : "false" }));
    setHasChanges(true);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const result = await updateSettings(settings);
      if (result.success) {
        toast.success("Settings saved successfully");
        setHasChanges(false);
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReset() {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      setSettings(DEFAULT_SETTINGS as unknown as Record<string, string>);
      setHasChanges(true);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Card>
          <CardHeader><Skeleton className="h-6 w-20" /></CardHeader>
          <CardContent className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your store settings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset} disabled={isSaving}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-200">
          You have unsaved changes. Click "Save Changes" to apply them.
        </div>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="announcement">Announcement</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>Basic information about your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    value={settings.storeName || ""}
                    onChange={(e) => handleChange("storeName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeEmail">Store Email</Label>
                  <Input
                    id="storeEmail"
                    type="email"
                    value={settings.storeEmail || ""}
                    onChange={(e) => handleChange("storeEmail", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="storePhone">Phone Number</Label>
                  <Input
                    id="storePhone"
                    value={settings.storePhone || ""}
                    onChange={(e) => handleChange("storePhone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                  <Input
                    id="whatsappNumber"
                    value={settings.whatsappNumber || ""}
                    onChange={(e) => handleChange("whatsappNumber", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeDescription">Store Description</Label>
                <Textarea
                  id="storeDescription"
                  value={settings.storeDescription || ""}
                  onChange={(e) => handleChange("storeDescription", e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
              <CardDescription>Your store's social media presence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="facebookUrl">Facebook URL</Label>
                  <Input
                    id="facebookUrl"
                    value={settings.facebookUrl || ""}
                    onChange={(e) => handleChange("facebookUrl", e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagramUrl">Instagram URL</Label>
                  <Input
                    id="instagramUrl"
                    value={settings.instagramUrl || ""}
                    onChange={(e) => handleChange("instagramUrl", e.target.value)}
                    placeholder="https://instagram.com/yourpage"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Settings</CardTitle>
              <CardDescription>Configure inventory management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  value={settings.lowStockThreshold || "5"}
                  onChange={(e) => handleChange("lowStockThreshold", e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Products with stock at or below this number will show a low stock warning
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Settings */}
        <TabsContent value="shipping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Rates</CardTitle>
              <CardDescription>Configure shipping costs for different areas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="shippingDhaka">Dhaka City Rate (BDT)</Label>
                  <Input
                    id="shippingDhaka"
                    type="number"
                    value={settings.shippingDhaka || "70"}
                    onChange={(e) => handleChange("shippingDhaka", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingOutside">Outside Dhaka Rate (BDT)</Label>
                  <Input
                    id="shippingOutside"
                    type="number"
                    value={settings.shippingOutside || "130"}
                    onChange={(e) => handleChange("shippingOutside", e.target.value)}
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="freeShippingMinimum">Free Shipping Minimum (BDT)</Label>
                <Input
                  id="freeShippingMinimum"
                  type="number"
                  value={settings.freeShippingMinimum || "2000"}
                  onChange={(e) => handleChange("freeShippingMinimum", e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Orders above this amount get free shipping (set to 0 to disable)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mobile Payment Numbers</CardTitle>
              <CardDescription>
                Configure merchant numbers for mobile payment methods.
                These numbers will be shown to customers during checkout.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bkashNumber">bKash Number</Label>
                <Input
                  id="bkashNumber"
                  value={settings.bkashNumber || ""}
                  onChange={(e) => handleChange("bkashNumber", e.target.value)}
                  placeholder="01XXXXXXXXX"
                />
                <p className="text-sm text-muted-foreground">
                  Your bKash personal/merchant number
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="nagadNumber">Nagad Number</Label>
                <Input
                  id="nagadNumber"
                  value={settings.nagadNumber || ""}
                  onChange={(e) => handleChange("nagadNumber", e.target.value)}
                  placeholder="01XXXXXXXXX"
                />
                <p className="text-sm text-muted-foreground">
                  Your Nagad personal/merchant number
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="rocketNumber">Rocket Number</Label>
                <Input
                  id="rocketNumber"
                  value={settings.rocketNumber || ""}
                  onChange={(e) => handleChange("rocketNumber", e.target.value)}
                  placeholder="01XXXXXXXXX"
                />
                <p className="text-sm text-muted-foreground">
                  Your Rocket personal/merchant number
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Announcement Settings */}
        <TabsContent value="announcement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Announcement Bar</CardTitle>
              <CardDescription>
                Configure the announcement bar that appears at the top of your store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Announcement</Label>
                  <p className="text-sm text-muted-foreground">
                    Show announcement bar on all pages
                  </p>
                </div>
                <Switch
                  checked={settings.announcementEnabled === "true"}
                  onCheckedChange={(checked) => handleSwitchChange("announcementEnabled", checked)}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="announcementMessage">Announcement Message</Label>
                <Input
                  id="announcementMessage"
                  value={settings.announcementMessage || ""}
                  onChange={(e) => handleChange("announcementMessage", e.target.value)}
                  placeholder="Free shipping on orders over BDT 2000!"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="announcementLink">Link URL</Label>
                  <Input
                    id="announcementLink"
                    value={settings.announcementLink || ""}
                    onChange={(e) => handleChange("announcementLink", e.target.value)}
                    placeholder="/shop"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="announcementLinkText">Link Text</Label>
                  <Input
                    id="announcementLinkText"
                    value={settings.announcementLinkText || ""}
                    onChange={(e) => handleChange("announcementLinkText", e.target.value)}
                    placeholder="Shop Now"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tracking Settings */}
        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Meta Pixel / Facebook Tracking</CardTitle>
              <CardDescription>
                Configure Facebook (Meta) Pixel and Conversions API for ad attribution. Set these after deployment—tracking does not work reliably on localhost.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Meta Pixel</Label>
                  <p className="text-sm text-muted-foreground">
                    Load the Pixel script and send events (PageView, ViewContent, AddToCart, InitiateCheckout, Purchase)
                  </p>
                </div>
                <Switch
                  checked={settings.metaPixelEnabled === "true"}
                  onCheckedChange={(checked) => handleSwitchChange("metaPixelEnabled", checked)}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="metaPixelId">Pixel ID</Label>
                <Input
                  id="metaPixelId"
                  value={settings.metaPixelId || ""}
                  onChange={(e) => handleChange("metaPixelId", e.target.value)}
                  placeholder="1234567890123456"
                />
                <p className="text-sm text-muted-foreground">
                  Found in Meta Events Manager → Data Sources → Your Pixel → Settings
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="metaCapiAccessToken">Conversions API Access Token</Label>
                <Input
                  id="metaCapiAccessToken"
                  type="password"
                  value={settings.metaCapiAccessToken || ""}
                  onChange={(e) => handleChange("metaCapiAccessToken", e.target.value)}
                  placeholder="••••••••••••••••"
                  autoComplete="off"
                />
                <p className="text-sm text-muted-foreground">
                  For server-side Purchase events (recommended for ad optimization). Generate in Events Manager → Settings → Conversions API. Stored securely—never sent to the browser.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating Save Button for Mobile */}
      {hasChanges && (
        <div className="fixed bottom-20 right-4 md:hidden">
          <Button onClick={handleSave} disabled={isSaving} size="lg" className="shadow-lg">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
