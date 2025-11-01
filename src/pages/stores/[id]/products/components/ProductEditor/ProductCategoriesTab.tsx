import { useState } from "react";
import { Label } from "@/components/ui/label";
import { MultiSelectCombobox, MultiSelectItem } from "@/components/ui/multi-select-combobox";
import { CreateCategoryDialog } from "./CreateCategoryDialog";
import { useCreateTaxonomy } from "../../hooks/useCreateTaxonomy";
import { useParams } from "react-router-dom";

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
  const { id: storeId } = useParams();
  const { createTaxonomy, isCreating } = useCreateTaxonomy(storeId!);
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] = useState(false);
  const [pendingCategoryName, setPendingCategoryName] = useState('');
  const [categoryResolve, setCategoryResolve] = useState<((value: MultiSelectItem | null) => void) | null>(null);

  const handleCreateCategory = async (name: string): Promise<MultiSelectItem | void> => {
    setPendingCategoryName(name);
    setShowCreateCategoryDialog(true);
    
    // Create a promise that will be resolved when the dialog is submitted
    return new Promise((resolve) => {
      setCategoryResolve(() => resolve);
    });
  };

  const handleCategoryDialogSubmit = async (data: { name: string; parent_id?: number }) => {
    const newCategory = await createTaxonomy('category', data);
    
    if (categoryResolve) {
      if (newCategory) {
        categoryResolve(newCategory);
      } else {
        categoryResolve(null);
      }
      setCategoryResolve(null);
    }
    
    return newCategory;
  };

  const handleDialogClose = (open: boolean) => {
    setShowCreateCategoryDialog(open);
    
    // If closing without creating, resolve with null
    if (!open && categoryResolve) {
      categoryResolve(null);
      setCategoryResolve(null);
    }
  };

  const handleCreateTag = async (name: string) => {
    return await createTaxonomy('tag', { name });
  };

  const handleCreateBrand = async (name: string) => {
    return await createTaxonomy('brand', { name });
  };

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
          onCreateNew={handleCreateCategory}
        />
      </div>

      <CreateCategoryDialog
        open={showCreateCategoryDialog}
        onOpenChange={handleDialogClose}
        availableCategories={availableCategories.map(c => ({ id: c.id, name: c.name }))}
        onSubmit={handleCategoryDialogSubmit}
        isSubmitting={isCreating}
        initialName={pendingCategoryName}
      />

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
          onCreateNew={handleCreateTag}
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
          onCreateNew={handleCreateBrand}
        />
      </div>
    </div>
  );
}
