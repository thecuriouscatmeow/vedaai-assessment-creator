import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AssignmentInput } from '@vedaai/shared';

/**
 * assignmentForm slice — tracks the two-step assignment creation flow.
 *
 * react-hook-form owns transient field state; this slice holds committed state
 * that persists across step navigation and is consumed by the submit thunk.
 *
 * Steps:
 *  1 — Assignment Details (form fields)
 *  2 — Live generation status (socket-driven)
 */
export interface AssignmentFormState {
  /** Last successfully validated form values (set on Next in step 1). */
  values: AssignmentInput | null;
  /** Cloudinary secure URL of the uploaded source file. */
  fileUrl: string | null;
  /** Upload in-flight indicator. */
  uploading: boolean;
  /** Current step in the two-step flow: 1 or 2. */
  currentStep: 1 | 2;
}

const initialState: AssignmentFormState = {
  values: null,
  fileUrl: null,
  uploading: false,
  currentStep: 1,
};

export const assignmentFormSlice = createSlice({
  name: 'assignmentForm',
  initialState,
  reducers: {
    setFormValues(state, action: PayloadAction<AssignmentInput>) {
      state.values = action.payload;
    },
    setFileUrl(state, action: PayloadAction<string>) {
      state.fileUrl = action.payload;
    },
    setUploading(state, action: PayloadAction<boolean>) {
      state.uploading = action.payload;
    },
    setStep(state, action: PayloadAction<1 | 2>) {
      state.currentStep = action.payload;
    },
    resetForm(state) {
      state.values = null;
      state.fileUrl = null;
      state.uploading = false;
      state.currentStep = 1;
    },
  },
});

export const { setFormValues, setFileUrl, setUploading, setStep, resetForm } =
  assignmentFormSlice.actions;

export default assignmentFormSlice.reducer;
