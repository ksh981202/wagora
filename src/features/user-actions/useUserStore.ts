import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type UserActionsState = {
  likedNails: string[]
  savedNails: string[]
  toggleLike: (id: string) => void
  toggleSave: (id: string) => void
}

export const useUserStore = create<UserActionsState>()(
  persist(
    (set) => ({
      likedNails: [],
      savedNails: [],
      toggleLike: (id) =>
        set((s) => ({
          likedNails: s.likedNails.includes(id)
            ? s.likedNails.filter((x) => x !== id)
            : [...s.likedNails, id],
        })),
      toggleSave: (id) =>
        set((s) => ({
          savedNails: s.savedNails.includes(id)
            ? s.savedNails.filter((x) => x !== id)
            : [...s.savedNails, id],
        })),
    }),
    { name: 'gelia-user-actions' },
  ),
)
