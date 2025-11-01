import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  parent_id?: string | null;
}

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableCategories: Category[];
  onSubmit: (data: { name: string; parent_id?: number }) => Promise<void>;
}

export function CreateCategoryDialog({ 
  open, 
  onOpenChange, 
  availableCategories, 
  onSubmit 
}: CreateCategoryDialogProps) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        parent_id: parentId && parentId !== 'none' ? parseInt(parentId) : undefined
      });
      setName('');
      setParentId('');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // רק root categories (ללא parent)
  const rootCategories = availableCategories.filter(c => !c.parent_id);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>צור קטגוריה חדשה</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="category-name">שם הקטגוריה *</Label>
            <Input 
              id="category-name"
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="לדוגמה: אלקטרוניקה"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          
          <div>
            <Label htmlFor="category-parent">קטגוריה ראשית (אופציונלי)</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger id="category-parent">
                <SelectValue placeholder="ללא קטגוריה ראשית" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ללא קטגוריה ראשית</SelectItem>
                {rootCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
              צור קטגוריה
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
