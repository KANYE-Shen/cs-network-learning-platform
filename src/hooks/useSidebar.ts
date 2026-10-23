import { create } from 'zustand'

/** 移动端侧栏抽屉状态 */
export const useSidebar = create<{ open: boolean; setOpen: (v: boolean) => void }>((set) => ({
  open: false,
  setOpen: (v) => set({ open: v }),
}))
