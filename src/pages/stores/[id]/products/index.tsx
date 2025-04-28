
import { Shell } from "@/components/layout/Shell";
import { useParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProductsTable } from "./components/ProductsTable";
import { ProductsPagination } from "./components/ProductsPagination";
import { ProductsHeader } from "./components/ProductsHeader";
import { useProducts } from "./hooks/useProducts";
import { useStore } from "./hooks/useStore";
import { useProductSync } from "./hooks/useProductSync";
import { useProductSearch } from "./hooks/useProductSearch";
import { useProductPagination } from "./hooks/useProductPagination";
import { SortField, SortDirection } from "./hooks/useProducts";
import { useState } from "react";

export default function StoreProductsPage() {
  const { id } = useParams();
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const { searchQuery, setSearchQuery } = useProductSearch();
  
  const { data: store } = useStore(id);
  const { data: products } = useProducts(id, sortField, sortDirection, searchQuery);
  const { 
    isSyncing, 
    autoSync, 
    hasValidStoreConfig,
    syncProducts,
    toggleAutoSync 
  } = useProductSync(store, id);

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedProducts
  } = useProductPagination(products);

  const sortProducts = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <Shell>
      <div className="space-y-6 w-full max-w-full">
        <ProductsHeader
          store={store}
          isSyncing={isSyncing}
          autoSync={autoSync}
          hasValidStoreConfig={hasValidStoreConfig}
          onAutoSyncToggle={toggleAutoSync}
          onSyncProducts={syncProducts}
        />

        <div className="relative w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 w-full"
          />
        </div>

        <div className="w-full overflow-x-auto">
          <ProductsTable 
            products={paginatedProducts}
            sortField={sortField}
            sortProducts={sortProducts}
          />
        </div>

        <ProductsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </Shell>
  );
}
