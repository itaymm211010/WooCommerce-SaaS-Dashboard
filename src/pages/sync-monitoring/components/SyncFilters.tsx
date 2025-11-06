import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface SyncFiltersProps {
  dateRange: DateRange;
  storeId: string;
  entityType: string;
  status: string;
  stores: any[];
  onDateRangeChange: (range: DateRange) => void;
  onStoreChange: (storeId: string) => void;
  onEntityTypeChange: (type: string) => void;
  onStatusChange: (status: string) => void;
  onClearFilters: () => void;
}

export const SyncFilters = ({
  dateRange,
  storeId,
  entityType,
  status,
  stores,
  onDateRangeChange,
  onStoreChange,
  onEntityTypeChange,
  onStatusChange,
  onClearFilters
}: SyncFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "MMM dd, yyyy")} - {format(dateRange.to, "MMM dd, yyyy")}
                </>
              ) : (
                format(dateRange.from, "MMM dd, yyyy")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => onDateRangeChange({ from: new Date(), to: new Date() })}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => onDateRangeChange({ from: subDays(new Date(), 7), to: new Date() })}
            >
              Last 7 Days
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => onDateRangeChange({ from: subDays(new Date(), 30), to: new Date() })}
            >
              Last 30 Days
            </Button>
          </div>
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={(range) => range && onDateRangeChange(range)}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      <Select value={storeId} onValueChange={onStoreChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Store" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Stores</SelectItem>
          {stores.map((store) => (
            <SelectItem key={store.id} value={store.id}>
              {store.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={entityType} onValueChange={onEntityTypeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Entity Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="product">Product</SelectItem>
          <SelectItem value="category">Category</SelectItem>
          <SelectItem value="tag">Tag</SelectItem>
          <SelectItem value="brand">Brand</SelectItem>
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="success">Success</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" size="icon" onClick={onClearFilters}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
