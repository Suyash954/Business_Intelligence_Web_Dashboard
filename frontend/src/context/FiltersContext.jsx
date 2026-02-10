import React, { createContext, useContext, useState } from "react";

const FiltersContext = createContext(undefined);

const defaultFilters = {
  dateFrom: null,
  dateTo: null,
  regions: [],
  channels: [],
  products: []
};

export function FiltersProvider({ children }) {
  const [filters, setFilters] = useState(defaultFilters);

  const updateFilters = (partial) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const resetFilters = () => setFilters(defaultFilters);

  return (
    <FiltersContext.Provider value={{ filters, updateFilters, resetFilters }}>
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) {
    throw new Error("useFilters must be used within FiltersProvider");
  }
  return ctx;
}

