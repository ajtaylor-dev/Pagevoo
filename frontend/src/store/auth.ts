import { create } from 'zustand'
import api from '../lib/api'

type User = { id: number, name: string, email: string, role: 'user' | 'admin' }
type State = {
  user: User | null
  loading: boolean
  login: (email: string, password: string, code?: string) => Promise<void>
  register: (name: string, email: string, password: string, secretQ: string, secretA: string, captcha: string) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
}

const useAuthStore = create<State>((set, get) => ({
  user: null,
  loading: false,
  async login(email, password, code) {
  set({ loading: true });
  try {
    await api.post('/auth/login', { email, password, code });
    await get().fetchMe();
  } catch (e) {
    throw e; // <-- IMPORTANT
  } finally {
    set({ loading: false });
  }
},
  async register(name, email, password, secretQ, secretA, captcha) {
  set({ loading: true });
  try {
    await api.post('/auth/register', { name, email, password, secretQ, secretA, captcha });
  } catch (e) {
    throw e; // <-- IMPORTANT
  } finally {
    set({ loading: false });
  }
},
  async fetchMe() {
    const { data } = await api.get('/auth/me')
    set({ user: data.user })
  },
  logout() {
    api.post('/auth/logout')
    set({ user: null })
  }
}))

export default useAuthStore
