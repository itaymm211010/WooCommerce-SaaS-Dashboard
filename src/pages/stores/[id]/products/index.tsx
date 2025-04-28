
import { Shell } from "@/components/layout/Shell";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProductsTable } from "./components/ProductsTable";
import { ProductsPagination } from "./components/ProductsPagination";
import { ProductsHeader } from "./components/ProductsHeader";
import { useProducts } from "./hooks/useProducts";
import { useStore } from "./hooks/useStore";
import { useProductSync } from "./hooks/useProductSync";
import { SortField, SortDirection } from "./hooks/useProducts";

export default function StoreProductsPage() {
  const { id } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;

  const { data: store } = useStore(id);
  const { data: products } = useProducts(id, sortField, sortDirection, searchQuery);
  const { 
    isSyncing, 
    autoSync, 
    hasValidStoreConfig,
    syncProducts,
    toggleAutoSync 
  } = useProductSync(store, id);

  const sortProducts = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const totalPages = products ? Math.ceil(products.length / itemsPerPage) : 0;
  const paginatedProducts = products?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Shell>
      <div className="space-y-8">
        <ProductsHeader
          store={store}
          isSyncing={isSyncing}
          autoSync={autoSync}
          hasValidStoreConfig={hasValidStoreConfig}
          onAutoSyncToggle={toggleAutoSync}
          onSyncProducts={syncProducts}
        />

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <ProductsTable 
          products={paginatedProducts}
          sortField={sortField}
          sortProducts={sortProducts}
        />

        <ProductsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </Shell>
  );
}
