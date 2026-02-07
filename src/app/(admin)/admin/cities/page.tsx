"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAdminCities,
  createCity,
  updateCity,
  deleteCity,
} from "@/actions/admin/cities";
import { slugify } from "@/lib/format";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";

interface City {
  id: string;
  name: string;
  value: string;
  shippingZone: "inside_dhaka" | "outside_dhaka";
  sortOrder: number;
}

export default function AdminCitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCityId, setEditCityId] = useState<string | null>(null);
  const [deleteCityId, setDeleteCityId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [shippingZone, setShippingZone] = useState<"inside_dhaka" | "outside_dhaka">("inside_dhaka");

  useEffect(() => {
    loadCities();
  }, []);

  async function loadCities() {
    setLoading(true);
    try {
      const data = await getAdminCities();
      setCities(data);
    } catch (error) {
      toast.error("Failed to load cities");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditCityId(null);
    setName("");
    setValue("");
    setShippingZone("inside_dhaka");
    setDialogOpen(true);
  }

  function openEdit(city: City) {
    setEditCityId(city.id);
    setName(city.name);
    setValue(city.value);
    setShippingZone(city.shippingZone);
    setDialogOpen(true);
  }

  function handleNameChange(newName: string) {
    setName(newName);
    if (!editCityId) setValue(slugify(newName));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("City name is required");
      return;
    }
    const cityValue = value.trim() || slugify(name);
    setActionLoading(true);
    try {
      if (editCityId) {
        const result = await updateCity(editCityId, {
          name: name.trim(),
          value: cityValue,
          shippingZone,
        });
        if (result.success) {
          toast.success("City updated");
          setDialogOpen(false);
          loadCities();
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await createCity({
          name: name.trim(),
          value: cityValue,
          shippingZone,
        });
        if (result.success) {
          toast.success("City added");
          setDialogOpen(false);
          loadCities();
        } else {
          toast.error(result.error);
        }
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteCityId) return;
    setActionLoading(true);
    try {
      await deleteCity(deleteCityId);
      toast.success("City deleted");
      setDeleteCityId(null);
      loadCities();
    } catch (error) {
      toast.error("Failed to delete city");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cities & Delivery Areas</h1>
        <p className="text-muted-foreground mt-1">
          Manage cities for checkout. Delivery zone (Inside/Outside Dhaka) determines shipping cost.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Cities</CardTitle>
            <CardDescription>
              Cities shown in checkout dropdown. Users select a city and delivery zone is set automatically.
            </CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add City
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Value (slug)</TableHead>
                  <TableHead>Delivery Zone</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No cities yet. Add cities for checkout.
                    </TableCell>
                  </TableRow>
                ) : (
                  cities.map((city) => (
                    <TableRow key={city.id}>
                      <TableCell className="font-medium">{city.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {city.value}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            city.shippingZone === "inside_dhaka"
                              ? "text-green-600 font-medium"
                              : "text-muted-foreground"
                          }
                        >
                          {city.shippingZone === "inside_dhaka"
                            ? "Inside Dhaka City Corporation"
                            : "Outside Dhaka City Corporation"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(city)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteCityId(city.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editCityId ? "Edit City" : "Add City"}</DialogTitle>
            <DialogDescription>
              Add or edit a delivery area. Users will select from this list at checkout.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="city-name">City / Area Name</Label>
              <Input
                id="city-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Dhaka, Dhanmondi, Gazipur"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city-value">Value (slug)</Label>
              <Input
                id="city-value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. dhaka, dhanmondi"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Used as form value. Auto-generated from name if left empty.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Delivery Zone</Label>
              <Select value={shippingZone} onValueChange={(v: "inside_dhaka" | "outside_dhaka") => setShippingZone(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inside_dhaka">Inside Dhaka City Corporation</SelectItem>
                  <SelectItem value="outside_dhaka">Outside Dhaka City Corporation</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Determines shipping cost at checkout (from Settings).
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editCityId ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCityId} onOpenChange={() => !actionLoading && setDeleteCityId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete City</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will remove the city from the checkout dropdown. Existing orders are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={actionLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
