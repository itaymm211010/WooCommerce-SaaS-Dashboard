import * as React from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface MultiSelectItem {
  id: number;
  name: string;
  slug: string;
}

interface MultiSelectComboboxProps {
  options?: MultiSelectItem[];
  selected: MultiSelectItem[];
  onSelect: (items: MultiSelectItem[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  createLabel?: string;
  badgeVariant?: "default" | "secondary" | "outline" | "destructive";
}

export function MultiSelectCombobox({
  options = [],
  selected,
  onSelect,
  placeholder = "בחר פריטים...",
  emptyMessage = "לא נמצאו פריטים",
  createLabel = "צור",
  badgeVariant = "secondary",
}: MultiSelectComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  
  // Use ref to track all items ever seen - doesn't cause re-renders
  const knownItemsRef = React.useRef<Map<number, MultiSelectItem>>(new Map());
  
  // Add items to known items map
  const addToKnownItems = (items: MultiSelectItem[]) => {
    items.forEach(item => {
      if (!knownItemsRef.current.has(item.id)) {
        knownItemsRef.current.set(item.id, item);
      }
    });
  };
  
  // Add options and selected to known items
  React.useEffect(() => {
    addToKnownItems(options);
    addToKnownItems(selected);
  }, [options, selected]);
  
  const createSlug = (name: string) =>
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "");

  const handleCreateNew = () => {
    if (!searchValue.trim()) return;

    const newItem: MultiSelectItem = {
      id: Date.now(),
      name: searchValue.trim(),
      slug: createSlug(searchValue),
    };

    // Add to known items immediately
    addToKnownItems([newItem]);
    onSelect([...selected, newItem]);
    setSearchValue("");
    setOpen(false);
  };

  const handleToggleItem = (item: MultiSelectItem) => {
    const isSelected = selected.some((s) => s.id === item.id);

    if (isSelected) {
      onSelect(selected.filter((s) => s.id !== item.id));
    } else {
      onSelect([...selected, item]);
    }
  };

  const handleRemoveItem = (item: MultiSelectItem) => {
    onSelect(selected.filter((s) => s.id !== item.id));
  };

  // Show all known items (from ref, options, and selected)
  const allOptions = React.useMemo(() => {
    const optionMap = new Map<number, MultiSelectItem>();
    
    // Add all known items from ref
    knownItemsRef.current.forEach((item) => optionMap.set(item.id, item));
    
    // Add current options (might have updates)
    options.forEach((opt) => optionMap.set(opt.id, opt));
    
    // Add selected items (in case they're new)
    selected.forEach((sel) => optionMap.set(sel.id, sel));
    
    return Array.from(optionMap.values());
  }, [options, selected, open]); // Add 'open' to force recalculation when dropdown opens

  const filteredOptions = allOptions.filter((option) =>
    option.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const showCreateOption = searchValue.trim() && 
    !filteredOptions.some(opt => opt.name.toLowerCase() === searchValue.toLowerCase());

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">
              {selected.length > 0
                ? `${selected.length} נבחרו`
                : placeholder}
            </span>
            <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="חפש..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                {showCreateOption ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={handleCreateNew}
                  >
                    <Plus className="me-2 h-4 w-4" />
                    {createLabel} "{searchValue}"
                  </Button>
                ) : (
                  <div className="py-6 text-center text-sm">{emptyMessage}</div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => {
                  const isSelected = selected.some((s) => s.id === option.id);
                  return (
                    <CommandItem
                      key={option.id}
                      value={option.name}
                      onSelect={() => handleToggleItem(option)}
                      className="gap-2"
                    >
                      <Checkbox checked={isSelected} />
                      <span className="flex-1">{option.name}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected items display */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((item) => (
            <Badge key={item.id} variant={badgeVariant} className="gap-1">
              {item.name}
              <button
                type="button"
                onClick={() => handleRemoveItem(item)}
                className="hover:text-destructive"
                aria-label={`הסר ${item.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
