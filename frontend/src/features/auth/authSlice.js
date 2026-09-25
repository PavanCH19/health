import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  status: 'idle',
  error: null,
  isLoggedIn: false,
  isProfileComplete: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action) {
      const payload = action.payload || {}
      state.user = payload
      state.status = 'authenticated'
      state.error = null
      state.isLoggedIn = true
      state.isProfileComplete = !!payload.isProfileComplete
    },
    completeProfile(state, action) {
      // merge profile fields and mark profile complete
      const payload = action.payload || {}
      state.user = state.user ? { ...state.user, ...payload, isProfileComplete: true } : { ...payload, isProfileComplete: true }
      state.status = 'authenticated'
      state.error = null
      state.isLoggedIn = true
      state.isProfileComplete = true
    },
    logout(state) {
      state.user = null
      state.status = 'idle'
      state.error = null
      state.isLoggedIn = false
      state.isProfileComplete = false
    },
    setError(state, action) {
      state.error = action.payload
    },
    setStatus(state, action) {
      state.status = action.payload
    }
  }
})

export const { login, completeProfile, logout, setError, setStatus } = authSlice.actions
export default authSlice.reducer
