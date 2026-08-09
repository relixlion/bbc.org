'use client'
import { create } from 'zustand'
import { SessionUser } from '@/types'

interface UserStore {
  user: SessionUser | null
  setUser: (u: SessionUser | null) => void
  updateBalance: (balance: number) => void
}

export const useUser = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  updateBalance: (wallet_balance) =>
    set((state) => ({ user: state.user ? { ...state.user, wallet_balance } : null })),
}))
