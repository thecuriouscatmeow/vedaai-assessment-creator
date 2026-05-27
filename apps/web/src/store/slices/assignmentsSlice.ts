import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AssignmentSummary } from '@vedaai/shared';

/**
 * assignmentsSlice — the list of AssignmentSummary records shown on the
 * Assignments list screen. Fetched from GET /api/assignments; updated
 * optimistically on delete.
 */
export interface AssignmentsState {
  items: AssignmentSummary[];
  loading: boolean;
  error: string | null;
}

const initialState: AssignmentsState = {
  items: [],
  loading: false,
  error: null,
};

export const assignmentsSlice = createSlice({
  name: 'assignments',
  initialState,
  reducers: {
    fetchStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchSuccess(state, action: PayloadAction<AssignmentSummary[]>) {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((a) => a.id !== action.payload);
    },
  },
});

export const { fetchStart, fetchSuccess, fetchFailure, removeItem } =
  assignmentsSlice.actions;

export default assignmentsSlice.reducer;
