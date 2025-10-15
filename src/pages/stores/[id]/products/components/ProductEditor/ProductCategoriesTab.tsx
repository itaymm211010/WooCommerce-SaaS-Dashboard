import { Label } from "@/components/ui/label";
import { MultiSelectCombobox, MultiSelectItem } from "@/components/ui/multi-select-combobox";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface Brand {
  id: number;
  name: string;
  slug: string;
}

interface ProductCategoriesTabProps {
  categories: Category[];
  tags: Tag[];
  brands: Brand[];
  onCategoriesChange: (categories: Category[]) => void;
  onTagsChange: (tags: Tag[]) => void;
  onBrandsChange: (brands: Brand[]) => void;
  availableCategories?: MultiSelectItem[];
  availableTags?: MultiSelectItem[];
  availableBrands?: MultiSelectItem[];
}

export function ProductCategoriesTab({
  categories,
  tags,
  brands,
  onCategoriesChange,
  onTagsChange,
  onBrandsChange,
  availableCategories = [],
  availableTags = [],
  availableBrands = [],
}: ProductCategoriesTabProps) {
  return (
    <div className="space-y-6">
      {/* Categories */}
      <div className="space-y-2">
        <Label>קטגוריות</Label>
        <MultiSelectCombobox
          options={availableCategories}
          selected={categories}
          onSelect={onCategoriesChange}
          placeholder="בחר או צור קטגוריות..."
          emptyMessage="לא נמצאו קטגוריות"
          createLabel="צור קטגוריה"
          badgeVariant="secondary"
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>תגים</Label>
        <MultiSelectCombobox
          options={availableTags}
          selected={tags}
          onSelect={onTagsChange}
          placeholder="בחר או צור תגים..."
          emptyMessage="לא נמצאו תגים"
          createLabel="צור תג"
          badgeVariant="outline"
        />
      </div>

      {/* Brands */}
      <div className="space-y-2">
        <Label>מותגים</Label>
        <MultiSelectCombobox
          options={availableBrands}
          selected={brands}
          onSelect={onBrandsChange}
          placeholder="בחר או צור מותגים..."
          emptyMessage="לא נמצאו מותגים"
          createLabel="צור מותג"
          badgeVariant="default"
        />
      </div>
    </div>
  );
}
