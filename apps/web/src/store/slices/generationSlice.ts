import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { QuestionPaper } from '@vedaai/shared';

/**
 * generation slice — tracks the lifecycle of an AI paper generation job:
 * idle → queued → processing → done | failed.
 *
 * The assignmentId is set immediately after a successful POST to /api/assignments.
 * The socket listener then drives status updates until done/failed.
 */
export type GenerationStatus = 'idle' | 'queued' | 'processing' | 'done' | 'failed';

export interface GenerationState {
  assignmentId: string | null;
  status: GenerationStatus;
  paper: QuestionPaper | null;
  error: string | null;
}

const initialState: GenerationState = {
  assignmentId: null,
  status: 'idle',
  paper: null,
  error: null,
};

export const generationSlice = createSlice({
  name: 'generation',
  initialState,
  reducers: {
    enqueued(state, action: PayloadAction<{ assignmentId: string }>) {
      state.assignmentId = action.payload.assignmentId;
      state.status = 'queued';
      state.paper = null;
      state.error = null;
    },
    processing(state) {
      state.status = 'processing';
    },
    succeeded(state, action: PayloadAction<{ paper: QuestionPaper }>) {
      state.status = 'done';
      state.paper = action.payload.paper;
      state.error = null;
    },
    failed(state, action: PayloadAction<{ error: string }>) {
      state.status = 'failed';
      state.error = action.payload.error;
    },
    resetGeneration(state) {
      state.assignmentId = null;
      state.status = 'idle';
      state.paper = null;
      state.error = null;
    },
  },
});

export const { enqueued, processing, succeeded, failed, resetGeneration } =
  generationSlice.actions;

export default generationSlice.reducer;
