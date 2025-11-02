import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { useCreateOrderNote } from "../hooks/useCreateOrderNote";
import type { Tables } from "@/integrations/supabase/types";

type Store = Tables<"stores">;

interface AddOrderNoteProps {
  storeId: string;
  orderId: string;
  store?: Store;
}

export const AddOrderNote = ({ storeId, orderId, store }: AddOrderNoteProps) => {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [customerNote, setCustomerNote] = useState(false);

  const createNoteMutation = useCreateOrderNote(storeId, orderId, store);

  const handleSubmit = () => {
    if (!note.trim()) return;

    createNoteMutation.mutate(
      {
        note: note.trim(),
        customer_note: customerNote,
      },
      {
        onSuccess: () => {
          setNote("");
          setCustomerNote(false);
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add Order Note</DialogTitle>
          <DialogDescription>
            Add a note to this order. Choose whether it should be visible to the customer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              placeholder="Enter your note here..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="customer-note">Customer Note</Label>
              <p className="text-sm text-muted-foreground">
                Make this note visible to the customer
              </p>
            </div>
            <Switch
              id="customer-note"
              checked={customerNote}
              onCheckedChange={setCustomerNote}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={createNoteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!note.trim() || createNoteMutation.isPending}
          >
            {createNoteMutation.isPending ? "Saving..." : "Save Note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
