import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { SolarModule, ModuleFilters } from '@bess-pro/shared';

// ============= MODULE STORE TYPES =============

interface ModuleState {
  // Cache data (from backend - already filtered/paginated)
  modules: SolarModule[];
  selectedModule: SolarModule | null;
  
  // Backend pagination info
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  
  // UI State (filters to send to backend)
  filters: ModuleFilters;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  
  // Selection state (for bulk operations)
  selectedModules: string[];
}

interface ModuleActions {
  // Cache actions (data from backend)
  setModules: (modules: SolarModule[]) => void;
  addModule: (module: SolarModule) => void;
  updateModule: (id: string, updates: Partial<SolarModule>) => void;
  removeModule: (id: string) => void;
  removeModules: (ids: string[]) => void;
  
  // Pagination info from backend
  setPaginationInfo: (info: { totalCount: number; totalPages: number }) => void;
  
  // Selection actions
  selectModule: (module: SolarModule | null) => void;
  toggleModuleSelection: (id: string) => void;
  selectAllModules: () => void;
  clearSelection: () => void;
  
  // Filter actions (UI state only - sent to backend)
  setFilters: (filters: ModuleFilters) => void;
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
  getModuleById: (id: string) => SolarModule | undefined;
  getSelectedModules: () => SolarModule[];
}

type ModuleStore = ModuleState & ModuleActions;

// ============= INITIAL STATE =============

const initialState: ModuleState = {
  modules: [],
  selectedModule: null,
  totalCount: 0,
  currentPage: 1,
  itemsPerPage: 20,
  totalPages: 0,
  filters: {},
  searchQuery: '',
  isLoading: false,
  error: null,
  selectedModules: [],
};

// ============= STORE CREATION =============

// ============= STORE CREATION =============

export const useModuleStore = create<ModuleStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // ============= CACHE ACTIONS =============

        setModules: (modules) => {
          set({ modules }, false, 'setModules');
        },

        addModule: (module) => {
          set((state) => {
            state.modules.push(module);
            state.totalCount += 1;
          }, false, 'addModule');
        },

        updateModule: (id, updates) => {
          set((state) => {
            const moduleIndex = state.modules.findIndex(mod => mod.id === id);
            if (moduleIndex !== -1) {
              // Deep merge automático e type-safe - preserva dados nested!
              Object.assign(state.modules[moduleIndex], updates);
            }
          });
        },

        removeModule: (id) => {
          set((state) => {
            state.modules = state.modules.filter(mod => mod.id !== id);
            if (state.selectedModule?.id === id) {
              state.selectedModule = null;
            }
            state.selectedModules = state.selectedModules.filter(selectedId => selectedId !== id);
            state.totalCount = Math.max(0, state.totalCount - 1);
          }, false, 'removeModule');
        },

        removeModules: (ids) => {
          set((state) => {
            state.modules = state.modules.filter(mod => !ids.includes(mod.id));
            if (ids.includes(state.selectedModule?.id || '')) {
              state.selectedModule = null;
            }
            state.selectedModules = state.selectedModules.filter(selectedId => !ids.includes(selectedId));
            state.totalCount = Math.max(0, state.totalCount - ids.length);
          }, false, 'removeModules');
        },

        // ============= SELECTION ACTIONS =============

        selectModule: (module) => {
          set((state) => {
            state.selectedModule = module;
          });
        },

        toggleModuleSelection: (id) => {
          set((state) => {
            const index = state.selectedModules.indexOf(id);
            if (index > -1) {
              state.selectedModules.splice(index, 1);
            } else {
              state.selectedModules.push(id);
            }
          });
        },

        selectAllModules: () => {
          set((state) => {
            state.selectedModules = state.modules.map(mod => mod.id);
          });
        },

        clearSelection: () => {
          set((state) => {
            state.selectedModules = [];
          });
        },

        // ============= PAGINATION INFO =============

        setPaginationInfo: (info) => {
          set((state) => {
            Object.assign(state, info);
          });
        },

        // ============= FILTER ACTIONS (UI STATE ONLY) =============

        setFilters: (filters) => {
          set((state) => {
            state.filters = filters;
            state.currentPage = 1;
          });
        },

        setSearchQuery: (query) => {
          set((state) => {
            state.searchQuery = query;
            state.currentPage = 1;
          });
        },

        clearFilters: () => {
          set((state) => {
            state.filters = {};
            state.searchQuery = '';
            state.currentPage = 1;
          });
        },

        // ============= UI ACTIONS =============

        setLoading: (loading) => {
          set((state) => {
            state.isLoading = loading;
          });
        },

        setError: (error) => {
          set((state) => {
            state.error = error;
          });
        },

        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },

        // ============= PAGINATION ACTIONS =============

        setCurrentPage: (page) => {
          set((state) => {
            state.currentPage = page;
          });
        },

        setItemsPerPage: (items) => {
          set((state) => {
            state.itemsPerPage = items;
            state.currentPage = 1;
          });
        },

        // ============= UTILITY ACTIONS =============

        resetStore: () => {
          set(initialState, false, 'resetStore');
        },

        getModuleById: (id) => {
          return get().modules.find((mod) => mod.id === id);
        },

        getSelectedModules: () => {
          const { modules, selectedModules } = get();
          return modules.filter((mod) => selectedModules.includes(mod.id));
        },
      })),
      {
        name: 'module-store',
        partialize: (state) => ({
          filters: state.filters,
          searchQuery: state.searchQuery,
          itemsPerPage: state.itemsPerPage,
        }),
      }
    ),
    {
      name: 'module-store',
    }
  )
);

// ============= SELECTORS =============

export const useModuleData = () => useModuleStore((state) => state.modules);
export const useSelectedModule = () => useModuleStore((state) => state.selectedModule);
export const useModuleFilters = () => useModuleStore((state) => state.filters);
export const useModuleLoading = () => useModuleStore((state) => state.isLoading);
export const useModuleError = () => useModuleStore((state) => state.error);
export const useModulePagination = () => useModuleStore((state) => ({
  currentPage: state.currentPage,
  itemsPerPage: state.itemsPerPage,
  totalCount: state.totalCount,
  totalPages: state.totalPages,
}));
export const useModuleSelection = () => useModuleStore((state) => state.selectedModules);

// ============= COMPUTED VALUES =============

export const useModuleStats = () => {
  const modules = useModuleData();
  const { totalCount } = useModulePagination();
  
  return {
    totalModules: modules.length,
    backendCount: totalCount, // Total from backend (after filtering)
    publicModules: modules.filter((mod) => mod.isPublic).length,
    privateModules: modules.filter((mod) => !mod.isPublic).length,
    averagePower: modules.length > 0 
      ? modules.reduce((sum, mod) => sum + mod.nominalPower, 0) / modules.length 
      : 0,
    averageEfficiency: modules.length > 0
      ? modules.reduce((sum, mod) => sum + mod.specifications.efficiency, 0) / modules.length
      : 0,
  };
};

// ============= QUERY PARAMS HELPER =============

export const useModuleQueryParams = () => {
  const filters = useModuleFilters();
  const searchQuery = useModuleStore((state) => state.searchQuery);
  const pagination = useModulePagination();
  
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