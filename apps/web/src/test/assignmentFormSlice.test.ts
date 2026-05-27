/**
 * Unit tests for assignmentFormSlice — verifies that actions mutate the slice
 * state correctly without any React rendering.
 */
import { describe, it, expect } from 'vitest';
import { makeStore } from '@/store/index';
import {
  setFormValues,
  setFileUrl,
  setUploading,
  resetForm,
} from '@/store/slices/assignmentFormSlice';
import type { AssignmentInput } from '@vedaai/shared';

const sampleInput: AssignmentInput = {
  dueDate: '2026-06-30',
  questions: [
    { type: 'mcq', count: 10, marks: 2 },
    { type: 'short', count: 5, marks: 4 },
  ],
};

describe('assignmentFormSlice', () => {
  it('starts with null values', () => {
    const store = makeStore();
    const { values, fileUrl, uploading } = store.getState().assignmentForm;
    expect(values).toBeNull();
    expect(fileUrl).toBeNull();
    expect(uploading).toBe(false);
  });

  it('setFormValues stores the form payload', () => {
    const store = makeStore();
    store.dispatch(setFormValues(sampleInput));
    expect(store.getState().assignmentForm.values).toEqual(sampleInput);
  });

  it('setFileUrl stores the Cloudinary URL', () => {
    const store = makeStore();
    store.dispatch(setFileUrl('https://res.cloudinary.com/demo/raw/upload/test.pdf'));
    expect(store.getState().assignmentForm.fileUrl).toBe(
      'https://res.cloudinary.com/demo/raw/upload/test.pdf',
    );
  });

  it('setUploading toggles the uploading flag', () => {
    const store = makeStore();
    store.dispatch(setUploading(true));
    expect(store.getState().assignmentForm.uploading).toBe(true);
    store.dispatch(setUploading(false));
    expect(store.getState().assignmentForm.uploading).toBe(false);
  });

  it('resetForm clears all state', () => {
    const store = makeStore();
    store.dispatch(setFormValues(sampleInput));
    store.dispatch(setFileUrl('https://res.cloudinary.com/demo/raw/upload/test.pdf'));
    store.dispatch(setUploading(true));
    store.dispatch(resetForm());
    const state = store.getState().assignmentForm;
    expect(state.values).toBeNull();
    expect(state.fileUrl).toBeNull();
    expect(state.uploading).toBe(false);
  });
});
