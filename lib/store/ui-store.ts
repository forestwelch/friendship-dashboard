import { create } from "zustand";

interface UIStore {
  openModal: string | null;
  setOpenModal: (modalId: string | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  openModal: null,
  setOpenModal: (modalId) => set({ openModal: modalId }),
}));



