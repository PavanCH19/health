import { createSlice } from '@reduxjs/toolkit';

const saved = localStorage.getItem('bc_theme');
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;

const uiSlice = createSlice({
  name: 'ui',
  initialState: { theme: saved || (prefersDark ? 'dark' : 'light') },
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('bc_theme', state.theme);
    },
  },
});

export const { toggleTheme } = uiSlice.actions;
export default uiSlice.reducer;
