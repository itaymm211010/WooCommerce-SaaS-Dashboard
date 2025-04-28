
import { useState } from 'react';

export const useProductSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return {
    searchQuery,
    setSearchQuery
  };
};
