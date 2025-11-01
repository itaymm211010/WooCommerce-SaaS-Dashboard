interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  count: number;
  parent_id?: string | null;
  parent_woo_id?: number | null;
  children?: CategoryItem[];
}

export function buildCategoryTree(categories: CategoryItem[]): CategoryItem[] {
  // מצא root categories (ללא parent)
  const roots = categories.filter(cat => !cat.parent_woo_id && !cat.parent_id);
  
  // פונקציה רקורסיבית למציאת ילדים
  function getChildren(parentWooId: number): CategoryItem[] {
    return categories
      .filter(cat => cat.parent_woo_id === parentWooId)
      .sort((a, b) => a.name.localeCompare(b.name, 'he'));
  }
  
  // בנה עץ רקורסיבי
  function buildTree(items: CategoryItem[]): CategoryItem[] {
    return items.map(item => ({
      ...item,
      children: buildTree(getChildren(item.id))
    }));
  }
  
  return buildTree(roots.sort((a, b) => a.name.localeCompare(b.name, 'he')));
}
