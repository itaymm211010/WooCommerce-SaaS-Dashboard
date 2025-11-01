import { useState } from 'react';
import { ChevronDown, ChevronLeft, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  count: number;
  parent_id?: string | null;
  children?: CategoryItem[];
}

interface CategoryTreeItemProps {
  category: CategoryItem;
  level?: number;
  onEdit?: (category: CategoryItem) => void;
  onDelete?: (category: CategoryItem) => void;
}

export function CategoryTreeItem({ 
  category, 
  level = 0,
  onEdit,
  onDelete
}: CategoryTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;
  
  return (
    <div className="space-y-1">
      <div 
        className="flex justify-between items-center p-3 border rounded hover:bg-accent transition-colors group"
        style={{ marginRight: `${level * 24}px` }}
      >
        <div className="flex items-center gap-3 flex-1">
          {hasChildren ? (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="hover:bg-accent rounded p-1"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}
          
          {level > 0 && (
            <span className="text-muted-foreground">└─</span>
          )}
          
          <div className="flex-1">
            <div className="font-medium">{category.name}</div>
            <div className="text-sm text-muted-foreground">{category.slug}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            {category.count} מוצרים
          </div>
          
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => onEdit(category)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => onDelete(category)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {hasChildren && isExpanded && category.children!.map(child => (
        <CategoryTreeItem 
          key={child.id} 
          category={child} 
          level={level + 1}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
