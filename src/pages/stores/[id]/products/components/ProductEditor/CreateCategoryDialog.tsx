import { useState, useEffect } from 'react';
import * as React from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Category {
  id: number;
  name: string;
}

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableCategories: Category[];
  onSubmit: (data: { name: string; parent_id?: number }) => Promise<{ id: number; name: string; slug: string } | null>;
  isSubmitting?: boolean;
  initialName?: string;
}

export function CreateCategoryDialog({
  open,
  onOpenChange,
  availableCategories,
  onSubmit,
  isSubmitting = false,
  initialName = '',
}: CreateCategoryDialogProps) {
  const [name, setName] = useState(initialName);
  const [parentId, setParentId] = useState<string>('');

  // Update name when initialName changes
  React.useEffect(() => {
    if (open && initialName) {
      setName(initialName);
    }
  }, [open, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    const result = await onSubmit({
      name: name.trim(),
      parent_id: parentId ? parseInt(parentId) : undefined,
    });

    if (result) {
      // Reset form
      setName('');
      setParentId('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>צור קטגוריה חדשה</DialogTitle>
            <DialogDescription>
              הזן את שם הקטגוריה ובחר קטגוריית אב (אופציונלי)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם הקטגוריה *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="הזן שם קטגוריה..."
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">קטגוריית אב (אופציונלי)</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger id="parent">
                  <SelectValue placeholder="בחר קטגוריית אב..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">אין (קטגוריה ראשית)</SelectItem>
                  {availableCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              ביטול
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? 'יוצר...' : 'צור קטגוריה'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
