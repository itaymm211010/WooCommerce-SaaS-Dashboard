
import { useState } from 'react';
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

export const useProductPagination = (products: Product[] | undefined, itemsPerPage: number = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = products ? Math.ceil(products.length / itemsPerPage) : 0;
  const paginatedProducts = products?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedProducts
  };
};
