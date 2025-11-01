import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface CreateBrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string }) => Promise<void>;
}

export function CreateBrandDialog({ 
  open, 
  onOpenChange, 
  onSubmit 
}: CreateBrandDialogProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim() });
      setName('');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>צור מותג חדש</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="brand-name">שם המותג *</Label>
            <Input 
              id="brand-name"
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="לדוגמה: Samsung"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
              צור מותג
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
