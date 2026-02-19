'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Equipment {
  _id: string;
  equipmentId: string;
  make: string;
  equipmentModel: string;
  preventativeMaintenanceSchedule?: string;
  partsInventory?: string;
  operatorDetails?: string;
}

interface EquipmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment | null;
  onSuccess: () => void;
}

export function EquipmentModal({
  open,
  onOpenChange,
  equipment,
  onSuccess,
}: EquipmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    equipmentId: '',
    make: '',
    equipmentModel: '',
    preventativeMaintenanceSchedule: '',
    partsInventory: '',
    operatorDetails: '',
  });

  useEffect(() => {
    if (equipment) {
      setFormData({
        equipmentId: equipment.equipmentId,
        make: equipment.make,
        equipmentModel: equipment.equipmentModel,
        preventativeMaintenanceSchedule: equipment.preventativeMaintenanceSchedule
          ? new Date(equipment.preventativeMaintenanceSchedule).toISOString().slice(0, 16)
          : '',
        partsInventory: equipment.partsInventory || '',
        operatorDetails: equipment.operatorDetails || '',
      });
    } else {
      setFormData({
        equipmentId: '',
        make: '',
        equipmentModel: '',
        preventativeMaintenanceSchedule: '',
        partsInventory: '',
        operatorDetails: '',
      });
    }
  }, [equipment, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = equipment
        ? `/api/admin/equipments/${equipment._id}`
        : '/api/admin/equipments';
      const method = equipment ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        preventativeMaintenanceSchedule: formData.preventativeMaintenanceSchedule
          ? new Date(formData.preventativeMaintenanceSchedule).toISOString()
          : undefined,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save equipment');
      }

      toast.success(
        `Equipment ${equipment ? 'updated' : 'created'} successfully`
      );
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
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {equipment ? 'Edit Equipment' : 'Add Equipment'}
            </DialogTitle>
            <DialogDescription>
              {equipment
                ? 'Update equipment details.'
                : 'Add a new equipment to the system.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="equipmentId">Equipment ID *</Label>
              <Input
                id="equipmentId"
                value={formData.equipmentId}
                onChange={(e) =>
                  setFormData({ ...formData, equipmentId: e.target.value })
                }
                placeholder="e.g., GEN-001"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="make">Make *</Label>
                <Input
                  id="make"
                  value={formData.make}
                  onChange={(e) =>
                    setFormData({ ...formData, make: e.target.value })
                  }
                  placeholder="e.g., Caterpillar"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={formData.equipmentModel}
                  onChange={(e) =>
                    setFormData({ ...formData, equipmentModel: e.target.value })
                  }
                  placeholder="e.g., C15"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule">Preventative Maintenance Schedule</Label>
              <Input
                id="schedule"
                type="datetime-local"
                value={formData.preventativeMaintenanceSchedule}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    preventativeMaintenanceSchedule: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inventory">Inventory of Parts Needed</Label>
              <Textarea
                id="inventory"
                value={formData.partsInventory}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, partsInventory: e.target.value })
                }
                placeholder="List parts needed for maintenance..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="operator">Operator / Contractor Details</Label>
              <Input
                id="operator"
                value={formData.operatorDetails}
                onChange={(e) =>
                  setFormData({ ...formData, operatorDetails: e.target.value })
                }
                placeholder="Name, Contact Number, Company..."
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
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
