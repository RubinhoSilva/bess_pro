import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Manufacturer, ManufacturerFilters } from '@bess-pro/shared';

// ============= MANUFACTURER STORE TYPES =============

interface ManufacturerState {
  // Cache data (from backend - already filtered/paginated)
  manufacturers: Manufacturer[];
  selectedManufacturer: Manufacturer | null;
  
  // Backend pagination info
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  
  // UI State (filters to send to backend)
  filters: ManufacturerFilters;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  
  // Selection state (for bulk operations)
  selectedManufacturers: string[];
}

interface ManufacturerActions {
  // Cache actions (data from backend)
  setManufacturers: (manufacturers: Manufacturer[]) => void;
  addManufacturer: (manufacturer: Manufacturer) => void;
  updateManufacturer: (id: string, updates: Partial<Manufacturer>) => void;
  removeManufacturer: (id: string) => void;
  removeManufacturers: (ids: string[]) => void;
  
  // Pagination info from backend
  setPaginationInfo: (info: { totalCount: number; totalPages: number }) => void;
  
  // Selection actions
  selectManufacturer: (manufacturer: Manufacturer | null) => void;
  toggleManufacturerSelection: (id: string) => void;
  selectAllManufacturers: () => void;
  clearSelection: () => void;
  
  // Filter actions (UI state only - sent to backend)
  setFilters: (filters: ManufacturerFilters) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
  
  // Pagination actions (UI state only)
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  
  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Utility actions
  resetStore: () => void;
  getManufacturerById: (id: string) => Manufacturer | undefined;
  getSelectedManufacturers: () => Manufacturer[];
}

type ManufacturerStore = ManufacturerState & ManufacturerActions;

// ============= INITIAL STATE =============

const initialState: ManufacturerState = {
  manufacturers: [],
  selectedManufacturer: null,
  totalCount: 0,
  currentPage: 1,
  itemsPerPage: 20,
  totalPages: 0,
  filters: {},
  searchQuery: '',
  isLoading: false,
  error: null,
  selectedManufacturers: [],
};

// ============= STORE CREATION =============

// ============= STORE CREATION =============

export const useManufacturerStore = create<ManufacturerStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // ============= CACHE ACTIONS =============

        setManufacturers: (manufacturers) => {
          set({ manufacturers }, false, 'setManufacturers');
        },

        addManufacturer: (manufacturer) => {
          set((state) => {
            state.manufacturers.push(manufacturer);
            state.totalCount += 1;
          }, false, 'addManufacturer');
        },

        updateManufacturer: (id, updates) => {
          set((state) => {
            const manufacturerIndex = state.manufacturers.findIndex(man => man.id === id);
            if (manufacturerIndex !== -1) {
              Object.assign(state.manufacturers[manufacturerIndex], updates);
            }
          }, false, 'updateManufacturer');
        },

        removeManufacturer: (id) => {
          set((state) => {
            state.manufacturers = state.manufacturers.filter((man) => man.id !== id);
            if (state.selectedManufacturer?.id === id) {
              state.selectedManufacturer = null;
            }
            state.selectedManufacturers = state.selectedManufacturers.filter((selectedId) => selectedId !== id);
            state.totalCount = Math.max(0, state.totalCount - 1);
          }, false, 'removeManufacturer');
        },

        removeManufacturers: (ids) => {
          set((state) => {
            state.manufacturers = state.manufacturers.filter((man) => !ids.includes(man.id));
            if (state.selectedManufacturer && ids.includes(state.selectedManufacturer.id)) {
              state.selectedManufacturer = null;
            }
            state.selectedManufacturers = state.selectedManufacturers.filter((selectedId) => !ids.includes(selectedId));
            state.totalCount = Math.max(0, state.totalCount - ids.length);
          }, false, 'removeManufacturers');
        },

        // ============= SELECTION ACTIONS =============

        selectManufacturer: (manufacturer) => {
          set({ selectedManufacturer: manufacturer }, false, 'selectManufacturer');
        },

        toggleManufacturerSelection: (id) => {
          set((state) => {
            const index = state.selectedManufacturers.indexOf(id);
            if (index > -1) {
              state.selectedManufacturers.splice(index, 1);
            } else {
              state.selectedManufacturers.push(id);
            }
          }, false, 'toggleManufacturerSelection');
        },

        selectAllManufacturers: () => {
          set((state) => {
            state.selectedManufacturers = state.manufacturers.map((man) => man.id);
          }, false, 'selectAllManufacturers');
        },

        clearSelection: () => {
          set({ selectedManufacturers: [] }, false, 'clearSelection');
        },

        // ============= PAGINATION INFO =============

        setPaginationInfo: (info) => {
          set(info, false, 'setPaginationInfo');
        },

        // ============= FILTER ACTIONS (UI STATE ONLY) =============

        setFilters: (filters) => {
          set((state) => {
            state.filters = filters;
            state.currentPage = 1;
          }, false, 'setFilters');
        },

        setSearchQuery: (query) => {
          set((state) => {
            state.searchQuery = query;
            state.currentPage = 1;
          }, false, 'setSearchQuery');
        },

        clearFilters: () => {
          set((state) => {
            state.filters = {};
            state.searchQuery = '';
            state.currentPage = 1;
          }, false, 'clearFilters');
        },



        // ============= UI ACTIONS =============

        setLoading: (loading) => {
          set({ isLoading: loading }, false, 'setLoading');
        },

        setError: (error) => {
          set({ error }, false, 'setError');
        },

        clearError: () => {
          set({ error: null }, false, 'clearError');
        },

        // ============= PAGINATION ACTIONS =============

        setCurrentPage: (page) => {
          set({ currentPage: page }, false, 'setCurrentPage');
        },

        setItemsPerPage: (items) => {
          set((state) => {
            state.itemsPerPage = items;
            state.currentPage = 1;
          }, false, 'setItemsPerPage');
        },

        // ============= UTILITY ACTIONS =============

        resetStore: () => {
          set(initialState, false, 'resetStore');
        },

        getManufacturerById: (id) => {
          return get().manufacturers.find((man) => man.id === id);
        },

        getSelectedManufacturers: () => {
          const { manufacturers, selectedManufacturers } = get();
          return manufacturers.filter((man) => selectedManufacturers.includes(man.id));
        },
      })),
      {
        name: 'manufacturer-store',
        partialize: (state) => ({
          filters: state.filters,
          searchQuery: state.searchQuery,
          itemsPerPage: state.itemsPerPage,
        }),
      }
    ),
    {
      name: 'manufacturer-store',
    }
  )
);

// ============= SELECTORS =============

export const useManufacturerData = () => useManufacturerStore((state) => state.manufacturers);
export const useSelectedManufacturer = () => useManufacturerStore((state) => state.selectedManufacturer);
export const useManufacturerFilters = () => useManufacturerStore((state) => state.filters);
export const useManufacturerLoading = () => useManufacturerStore((state) => state.isLoading);
export const useManufacturerError = () => useManufacturerStore((state) => state.error);
export const useManufacturerPagination = () => useManufacturerStore((state) => ({
  currentPage: state.currentPage,
  itemsPerPage: state.itemsPerPage,
  totalCount: state.totalCount,
  totalPages: state.totalPages,
}));
export const useManufacturerSelection = () => useManufacturerStore((state) => state.selectedManufacturers);

// ============= COMPUTED VALUES =============

export const useManufacturerStats = () => {
  const manufacturers = useManufacturerData();
  const { totalCount } = useManufacturerPagination();
  
  return {
    totalManufacturers: manufacturers.length,
    backendCount: totalCount, // Total from backend (after filtering)
    activeManufacturers: manufacturers.filter((man) => man.status === 'active').length,
    inactiveManufacturers: manufacturers.filter((man) => man.status === 'inactive').length,
    manufacturersWithWebsite: manufacturers.filter((man) => !!man.website).length,
    manufacturersWithSupport: manufacturers.filter((man) => 
      !!(man.contact.supportEmail || man.contact.supportPhone)
    ).length,
    averageFoundedYear: manufacturers.length > 0
      ? manufacturers
          .filter((man) => man.business.foundedYear)
          .reduce((sum, man) => sum + (man.business.foundedYear || 0), 0) / 
          manufacturers.filter((man) => man.business.foundedYear).length
      : 0,
  };
};

// ============= QUERY PARAMS HELPER =============

export const useManufacturerQueryParams = () => {
  const filters = useManufacturerFilters();
  const searchQuery = useManufacturerStore((state) => state.searchQuery);
  const pagination = useManufacturerPagination();
  
  return {
    filters: {
      ...filters,
      searchTerm: searchQuery,
    },
    pagination: {
      page: pagination.currentPage,
      limit: pagination.itemsPerPage,
    },
  };
};

// ============= UTILITY HOOKS =============

export const useManufacturerOptions = () => {
  const manufacturers = useManufacturerData();
  
  return manufacturers.map((manufacturer) => ({
    value: manufacturer.id,
    label: manufacturer.name,
    description: manufacturer.description,
    logoUrl: manufacturer.metadata.logoUrl,
    country: manufacturer.contact.address?.country,
    specialties: manufacturer.metadata.specialties,
  }));
};