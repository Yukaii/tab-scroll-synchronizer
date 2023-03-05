import { createStore } from "zustand/vanilla"

type State = {
  syncTabIds: number[]
  setSyncTabIds: (tabIds: number[]) => void
  recentTabIds: number[]
  setRecentTabIds: (tabIds: number[]) => void
}

export const store = createStore<State>((set) => ({
  syncTabIds: [],
  setSyncTabIds: (tabIds) => set({ syncTabIds: tabIds }),
  recentTabIds: [],
  setRecentTabIds: (tabIds) => set({ recentTabIds: tabIds })
}))
