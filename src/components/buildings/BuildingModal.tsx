'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Building {
  _id: string;
  name: string;
  code: string;
  address?: string;
  floors: number;
  isActive: boolean;
}

interface BuildingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building?: Building | null;
  onSuccess: () => void;
}

export function BuildingModal({
  open,
  onOpenChange,
  building,
  onSuccess,
}: BuildingModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    floors: 1,
  });

  useEffect(() => {
    if (building) {
      setFormData({
        name: building.name,
        code: building.code,
        address: building.address || '',
        floors: building.floors,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        address: '',
        floors: 1,
      });
    }
  }, [building, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = building
        ? `/api/admin/buildings/${building._id}`
        : '/api/admin/buildings';
      const method = building ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          Array.isArray(data.error)
            ? data.error[0]?.message
            : data.error || 'Failed to save building'
        );
      }

      toast.success(building ? 'Building updated successfully' : 'Building created successfully');
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{building ? 'Edit Building' : 'Add New Building'}</DialogTitle>
            <DialogDescription>
              {building
                ? 'Update building information.'
                : 'Create a new building for the complex.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Building Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Tower A"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Building Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                placeholder="e.g., A"
                maxLength={5}
                className="uppercase"
                required
              />
              <p className="text-xs text-muted-foreground">
                Short code for parking slot prefixes (max 5 characters)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="e.g., 123 Main St"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="floors">Number of Floors *</Label>
              <Input
                id="floors"
                type="number"
                min={1}
                value={formData.floors}
                onChange={(e) =>
                  setFormData({ ...formData, floors: parseInt(e.target.value) || 1 })
                }
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {building ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
