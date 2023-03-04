import { createStore } from 'zustand/vanilla'

type State = {
  syncTabIds: number[]
  setSyncTabIds: (tabIds: number[]) => void
}

export const store = createStore<State>((set) => ({
  syncTabIds: [],
  setSyncTabIds: (tabIds) => set({ syncTabIds: tabIds }),
}))