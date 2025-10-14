import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useState } from "react";

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

interface ProductCategoriesTabProps {
  categories: Category[];
  tags: Tag[];
  brand: string;
  onCategoriesChange: (categories: Category[]) => void;
  onTagsChange: (tags: Tag[]) => void;
  onBrandChange: (brand: string) => void;
}

export function ProductCategoriesTab({
  categories,
  tags,
  brand,
  onCategoriesChange,
  onTagsChange,
  onBrandChange,
}: ProductCategoriesTabProps) {
  const [newCategory, setNewCategory] = useState("");
  const [newTag, setNewTag] = useState("");

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    
    const category: Category = {
      id: Date.now(),
      name: newCategory.trim(),
      slug: newCategory.trim().toLowerCase().replace(/\s+/g, '-')
    };
    
    onCategoriesChange([...categories, category]);
    setNewCategory("");
  };

  const handleRemoveCategory = (id: number) => {
    onCategoriesChange(categories.filter(cat => cat.id !== id));
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    const tag: Tag = {
      id: Date.now(),
      name: newTag.trim(),
      slug: newTag.trim().toLowerCase().replace(/\s+/g, '-')
    };
    
    onTagsChange([...tags, tag]);
    setNewTag("");
  };

  const handleRemoveTag = (id: number) => {
    onTagsChange(tags.filter(tag => tag.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Brand */}
      <div className="space-y-2">
        <Label htmlFor="brand">מותג</Label>
        <Input
          id="brand"
          value={brand}
          onChange={(e) => onBrandChange(e.target.value)}
          placeholder="הזן שם מותג"
        />
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <Label>קטגוריות</Label>
        <div className="flex gap-2">
          <Input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            placeholder="הוסף קטגוריה"
          />
          <Button type="button" onClick={handleAddCategory}>
            הוסף
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {categories.map((category) => (
            <Badge key={category.id} variant="secondary" className="gap-1">
              {category.name}
              <button
                type="button"
                onClick={() => handleRemoveCategory(category.id)}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>תגים</Label>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="הוסף תג"
          />
          <Button type="button" onClick={handleAddTag}>
            הוסף
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag) => (
            <Badge key={tag.id} variant="outline" className="gap-1">
              {tag.name}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
