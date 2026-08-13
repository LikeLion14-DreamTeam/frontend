import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

const sharedAuthStorage = {
  getItem: (name) => {
    const value = localStorage.getItem(name)

    if (value) {
      return value
    }

    const legacyValue = sessionStorage.getItem(name)

    if (legacyValue) {
      localStorage.setItem(name, legacyValue)
      sessionStorage.removeItem(name)
    }

    return legacyValue
  },
  setItem: (name, value) => {
    localStorage.setItem(name, value)
  },
  removeItem: (name) => {
    localStorage.removeItem(name)
    sessionStorage.removeItem(name)
  },
}

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'orte_auth',
      storage: createJSONStorage(() => sharedAuthStorage),
      partialize: (state) => ({ user: state.user }),
    },
  ),
)

export default useAuthStore
