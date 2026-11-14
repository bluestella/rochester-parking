'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { errorMessage } from '@/lib/client';
import { cn } from '@/lib/utils';

export type FormValues = Record<string, string | boolean>;

export interface FieldDef {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'textarea' | 'select' | 'date' | 'datetime-local' | 'month' | 'checkbox';
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
  /** Half-width on wider dialogs. */
  half?: boolean;
  step?: string;
  min?: string;
  showIf?: (values: FormValues) => boolean;
}

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FieldDef[];
  initial?: Record<string, unknown>;
  submitLabel: string;
  /** Throw to keep the dialog open and show the message. */
  onSubmit: (values: FormValues) => Promise<void>;
}

function startingValues(fields: FieldDef[], initial?: Record<string, unknown>): FormValues {
  return Object.fromEntries(
    fields.map((f) => {
      const value = initial?.[f.name];
      if (f.type === 'checkbox') return [f.name, Boolean(value)];
      return [f.name, value === undefined || value === null ? '' : String(value)];
    })
  );
}

/**
 * Every create/edit dialog in the app is one of these: a list of field
 * definitions and a submit handler. Keeps labels, spacing, validation
 * messages and button wording consistent.
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initial,
  submitLabel,
  onSubmit,
}: FormDialogProps) {
  const [values, setValues] = useState<FormValues>(() => startingValues(fields, initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues(startingValues(fields, initial));
      setError(null);
    }
    // Reset only when the dialog opens; field definitions are static per dialog.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (name: string, value: string | boolean) => setValues((v) => ({ ...v, [name]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // Hidden fields and blank numbers are left out so the server applies its defaults.
      const payload: FormValues = {};
      for (const f of fields) {
        if (f.showIf && !f.showIf(values)) continue;
        if (f.type === 'number' && values[f.name] === '') continue;
        payload[f.name] = values[f.name];
      }
      await onSubmit(payload);
      onOpenChange(false);
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          <div className="grid grid-cols-2 gap-x-4 gap-y-4 py-5">
            {fields.map((f) => {
              if (f.showIf && !f.showIf(values)) return null;
              const id = `field-${f.name}`;
              const hintId = f.hint ? `${id}-hint` : undefined;

              if (f.type === 'checkbox') {
                return (
                  <label key={f.name} htmlFor={id} className="col-span-2 flex items-start gap-2.5 text-sm">
                    <input
                      id={id}
                      type="checkbox"
                      checked={Boolean(values[f.name])}
                      onChange={(e) => set(f.name, e.target.checked)}
                      className="mt-0.5 size-4 accent-primary"
                    />
                    <span>
                      <span className="font-medium">{f.label}</span>
                      {f.hint && <span className="block text-muted-foreground">{f.hint}</span>}
                    </span>
                  </label>
                );
              }

              const common = {
                id,
                required: f.required,
                'aria-describedby': hintId,
                value: String(values[f.name] ?? ''),
              };

              return (
                <div key={f.name} className={cn('space-y-1.5', f.half ? 'col-span-2 sm:col-span-1' : 'col-span-2')}>
                  <Label htmlFor={id}>
                    {f.label}
                    {!f.required && <span className="font-normal text-muted-foreground"> (optional)</span>}
                  </Label>
                  {f.type === 'textarea' ? (
                    <Textarea {...common} rows={4} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />
                  ) : f.type === 'select' ? (
                    <NativeSelect {...common} onChange={(e) => set(f.name, e.target.value)}>
                      {!f.required && <option value="">None</option>}
                      {f.required && !common.value && <option value="" disabled>Choose…</option>}
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </NativeSelect>
                  ) : (
                    <Input
                      {...common}
                      type={f.type ?? 'text'}
                      step={f.step ?? (f.type === 'number' ? 'any' : undefined)}
                      min={f.min ?? (f.type === 'number' ? '0' : undefined)}
                      placeholder={f.placeholder}
                      onChange={(e) => set(f.name, e.target.value)}
                    />
                  )}
                  {f.hint && (
                    <p id={hintId} className="text-xs text-muted-foreground">
                      {f.hint}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <p role="alert" className="mb-4 rounded-md bg-danger-subtle px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" aria-hidden />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
