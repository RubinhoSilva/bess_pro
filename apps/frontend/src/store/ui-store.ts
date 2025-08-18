import { create } from 'zustand';

interface UIStore {
  // Theme
  theme: 'light' | 'dark' | 'system';
  
  // Layout
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // Loading states
  globalLoading: boolean;
  
  // Modal states
  modals: Record<string, boolean>;
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  toggleModal: (modalId: string) => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  // Initial state
  theme: 'system',
  sidebarOpen: true,
  sidebarCollapsed: false,
  globalLoading: false,
  modals: {},

  // Actions
  setTheme: (theme) => {
    set({ theme });
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', systemDark);
    }
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed });
  },

  setGlobalLoading: (loading) => {
    set({ globalLoading: loading });
  },

  openModal: (modalId) => {
    set((state) => ({
      modals: { ...state.modals, [modalId]: true }
    }));
  },

  closeModal: (modalId) => {
    set((state) => ({
      modals: { ...state.modals, [modalId]: false }
    }));
  },

  toggleModal: (modalId) => {
    const { modals } = get();
    set({
      modals: { ...modals, [modalId]: !modals[modalId] }
    });
  },
}));