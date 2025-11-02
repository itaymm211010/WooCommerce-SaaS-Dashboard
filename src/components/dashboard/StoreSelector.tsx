import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";

type Store = Tables<"stores">;

interface StoreSelectorProps {
  stores: Store[];
  selectedStoreId: string | null;
  onStoreSelect: (storeId: string | null) => void;
  isAdmin: boolean;
}

export function StoreSelector({
  stores,
  selectedStoreId,
  onStoreSelect,
  isAdmin,
}: StoreSelectorProps) {
  const handleChange = (value: string) => {
    if (value === "all") {
      onStoreSelect(null);
    } else {
      onStoreSelect(value);
    }
  };

  return (
    <Select value={selectedStoreId || "all"} onValueChange={handleChange}>
      <SelectTrigger className="w-full sm:w-[250px]">
        <SelectValue placeholder="בחר חנות" />
      </SelectTrigger>
      <SelectContent>
        {isAdmin && <SelectItem value="all">כל החנויות</SelectItem>}
        {stores.map((store) => (
          <SelectItem key={store.id} value={store.id}>
            {store.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
