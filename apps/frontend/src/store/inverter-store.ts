import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Inverter, InverterFilters } from '@bess-pro/shared';

// ============= INVERTER STORE TYPES =============

interface InverterState {
  // Cache data (from backend - already filtered/paginated)
  inverters: Inverter[];
  selectedInverter: Inverter | null;
  
  // Backend pagination info
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  
  // UI State (filters to send to backend)
  filters: InverterFilters;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  
  // Selection state (for bulk operations)
  selectedInverters: string[];
}

interface InverterActions {
  // Cache actions (data from backend)
  setInverters: (inverters: Inverter[]) => void;
  addInverter: (inverter: Inverter) => void;
  updateInverter: (id: string, updates: Partial<Inverter>) => void;
  removeInverter: (id: string) => void;
  removeInverters: (ids: string[]) => void;
  
  // Pagination info from backend
  setPaginationInfo: (info: { totalCount: number; totalPages: number }) => void;
  
  // Selection actions
  selectInverter: (inverter: Inverter | null) => void;
  toggleInverterSelection: (id: string) => void;
  selectAllInverters: () => void;
  clearSelection: () => void;
  
  // Filter actions (UI state only - sent to backend)
  setFilters: (filters: InverterFilters) => void;
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
  getInverterById: (id: string) => Inverter | undefined;
  getSelectedInverters: () => Inverter[];
}

type InverterStore = InverterState & InverterActions;

// ============= INITIAL STATE =============

const initialState: InverterState = {
  inverters: [],
  selectedInverter: null,
  totalCount: 0,
  currentPage: 1,
  itemsPerPage: 20,
  totalPages: 0,
  filters: {},
  searchQuery: '',
  isLoading: false,
  error: null,
  selectedInverters: [],
};

// ============= STORE CREATION =============

export const useInverterStore = create<InverterStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // ============= CACHE ACTIONS =============

        setInverters: (inverters) => {
          set({ inverters }, false, 'setInverters');
        },

        addInverter: (inverter) => {
          set((state) => {
            state.inverters.push(inverter);
            state.totalCount += 1;
          }, false, 'addInverter');
        },

        updateInverter: (id, updates) => {
          set((state) => {
            const inverterIndex = state.inverters.findIndex(inv => inv.id === id);
            if (inverterIndex !== -1) {
              Object.assign(state.inverters[inverterIndex], updates);
            }
          }, false, 'updateInverter');
        },

        removeInverter: (id) => {
          set((state) => {
            state.inverters = state.inverters.filter((inv) => inv.id !== id);
            if (state.selectedInverter?.id === id) {
              state.selectedInverter = null;
            }
            state.selectedInverters = state.selectedInverters.filter((selectedId) => selectedId !== id);
            state.totalCount = Math.max(0, state.totalCount - 1);
          }, false, 'removeInverter');
        },

        removeInverters: (ids) => {
          set((state) => {
            state.inverters = state.inverters.filter((inv) => !ids.includes(inv.id));
            if (state.selectedInverter && ids.includes(state.selectedInverter.id)) {
              state.selectedInverter = null;
            }
            state.selectedInverters = state.selectedInverters.filter((selectedId) => !ids.includes(selectedId));
            state.totalCount = Math.max(0, state.totalCount - ids.length);
          }, false, 'removeInverters');
        },

        // ============= PAGINATION INFO =============

        setPaginationInfo: (info) => {
          set(info, false, 'setPaginationInfo');
        },

        // ============= SELECTION ACTIONS =============

        selectInverter: (inverter) => {
          set({ selectedInverter: inverter }, false, 'selectInverter');
        },

        toggleInverterSelection: (id) => {
          set((state) => {
            const index = state.selectedInverters.indexOf(id);
            if (index > -1) {
              state.selectedInverters.splice(index, 1);
            } else {
              state.selectedInverters.push(id);
            }
          }, false, 'toggleInverterSelection');
        },

        selectAllInverters: () => {
          set((state) => {
            state.selectedInverters = state.inverters.map((inv) => inv.id);
          }, false, 'selectAllInverters');
        },

        clearSelection: () => {
          set({ selectedInverters: [] }, false, 'clearSelection');
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

        // ============= PAGINATION ACTIONS (UI STATE ONLY) =============

        setCurrentPage: (page) => {
          set({ currentPage: page }, false, 'setCurrentPage');
        },

        setItemsPerPage: (items) => {
          set((state) => {
            state.itemsPerPage = items;
            state.currentPage = 1;
          }, false, 'setItemsPerPage');
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

        // ============= UTILITY ACTIONS =============

        resetStore: () => {
          set(initialState, false, 'resetStore');
        },

        getInverterById: (id) => {
          return get().inverters.find((inv) => inv.id === id);
        },

        getSelectedInverters: () => {
          const { inverters, selectedInverters } = get();
          return inverters.filter((inv) => selectedInverters.includes(inv.id));
        },
      })),
      {
        name: 'inverter-store',
        partialize: (state) => ({
          filters: state.filters,
          searchQuery: state.searchQuery,
          itemsPerPage: state.itemsPerPage,
        }),
      }
    ),
    {
      name: 'inverter-store',
    }
  )
);

// ============= SELECTORS =============

export const useInverterData = () => useInverterStore((state) => state.inverters);
export const useSelectedInverter = () => useInverterStore((state) => state.selectedInverter);
export const useInverterFilters = () => useInverterStore((state) => state.filters);
export const useInverterSearchQuery = () => useInverterStore((state) => state.searchQuery);
export const useInverterLoading = () => useInverterStore((state) => state.isLoading);
export const useInverterError = () => useInverterStore((state) => state.error);
export const useInverterPagination = () => useInverterStore((state) => ({
  currentPage: state.currentPage,
  itemsPerPage: state.itemsPerPage,
  totalCount: state.totalCount,
  totalPages: state.totalPages,
}));
export const useInverterSelection = () => useInverterStore((state) => state.selectedInverters);

// ============= QUERY PARAMS HELPER =============

export const useInverterQueryParams = () => {
  const filters = useInverterFilters();
  const searchQuery = useInverterSearchQuery();
  const pagination = useInverterPagination();
  
  return {
    filters: {
      ...filters,
      searchTerm: searchQuery || filters.searchTerm,
    },
    pagination: {
      page: pagination.currentPage,
      limit: pagination.itemsPerPage,
    },
  };
};