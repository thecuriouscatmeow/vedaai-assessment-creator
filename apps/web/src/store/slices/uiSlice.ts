import { createSlice } from '@reduxjs/toolkit';

/**
 * Placeholder UI slice — proves the store is wired end-to-end. Real slices
 * (assignment form, generation status driven by socket events) arrive in
 * Phase 3.
 */
interface UiState {
  initialized: boolean;
}

const initialState: UiState = { initialized: true };

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {},
});

export default uiSlice.reducer;
