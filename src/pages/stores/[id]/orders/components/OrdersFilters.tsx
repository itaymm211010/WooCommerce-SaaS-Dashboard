
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface OrdersFiltersProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  orderIdSearch: string;
  onOrderIdSearchChange: (value: string) => void;
}

export function OrdersFilters({
  searchQuery,
  onSearchQueryChange,
  orderIdSearch,
  onOrderIdSearchChange
}: OrdersFiltersProps) {
  return (
    <div className="flex gap-4">
      <div className="relative flex-1">
        <Search className="absolute start-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by customer name..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="ps-8"
        />
      </div>
      <div className="relative w-[200px]">
        <Input
          placeholder="Order ID"
          value={orderIdSearch}
          onChange={(e) => onOrderIdSearchChange(e.target.value)}
          type="number"
        />
      </div>
    </div>
  );
}
