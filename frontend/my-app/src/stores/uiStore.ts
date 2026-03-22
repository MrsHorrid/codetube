// stores/uiStore.ts
import { create } from 'zustand';

interface UIState {
  // Sidebar states
  isSidebarOpen: boolean;
  isLessonSidebarOpen: boolean;
  
  // Search
  isSearchOpen: boolean;
  searchQuery: string;
  
  // Modals
  activeModal: string | null;
  modalData: any;
  
  // Notifications
  toasts: Array<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  }>;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleLessonSidebar: () => void;
  setLessonSidebarOpen: (open: boolean) => void;
  openSearch: () => void;
  closeSearch: () => void;
  setSearchQuery: (query: string) => void;
  openModal: (modal: string, data?: any) => void;
  closeModal: () => void;
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isSidebarOpen: false,
  isLessonSidebarOpen: true,
  isSearchOpen: false,
  searchQuery: '',
  activeModal: null,
  modalData: null,
  toasts: [],

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleLessonSidebar: () => set((state) => ({ isLessonSidebarOpen: !state.isLessonSidebarOpen })),
  setLessonSidebarOpen: (open) => set({ isLessonSidebarOpen: open }),
  
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false, searchQuery: '' }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  openModal: (modal, data) => set({ activeModal: modal, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
  
  addToast: (type, message) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }));
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 5000);
  },
  
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),
}));
