import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  theme: 'light',
  sidebarOpen: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
    },
    setSidebar(state, action) {
      state.sidebarOpen = !!action.payload
    }
  }
})

export const { toggleTheme, setSidebar } = uiSlice.actions
export default uiSlice.reducer
