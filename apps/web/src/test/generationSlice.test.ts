/**
 * Unit tests for generationSlice — verifies lifecycle transitions.
 */
import { describe, it, expect } from 'vitest';
import { makeStore } from '@/store/index';
import {
  enqueued,
  processing,
  succeeded,
  failed,
  resetGeneration,
} from '@/store/slices/generationSlice';
import type { QuestionPaper } from '@vedaai/shared';

const samplePaper: QuestionPaper = {
  title: 'Math Test',
  schoolName: 'Delhi Public School, Sector-4, Bokaro',
  subject: 'Mathematics',
  className: 'Class 8',
  totalMarks: 50,
  studentInfo: {},
  sections: [
    {
      title: 'Section A',
      questions: [{ text: 'What is 2+2?', difficulty: 'easy', marks: 2 }],
    },
  ],
};

describe('generationSlice', () => {
  it('starts idle with no assignmentId', () => {
    const store = makeStore();
    const state = store.getState().generation;
    expect(state.status).toBe('idle');
    expect(state.assignmentId).toBeNull();
    expect(state.paper).toBeNull();
    expect(state.error).toBeNull();
  });

  it('enqueued sets assignmentId and queued status', () => {
    const store = makeStore();
    store.dispatch(enqueued({ assignmentId: 'abc-123' }));
    const state = store.getState().generation;
    expect(state.assignmentId).toBe('abc-123');
    expect(state.status).toBe('queued');
    expect(state.paper).toBeNull();
    expect(state.error).toBeNull();
  });

  it('processing transitions to processing status', () => {
    const store = makeStore();
    store.dispatch(enqueued({ assignmentId: 'abc-123' }));
    store.dispatch(processing());
    expect(store.getState().generation.status).toBe('processing');
  });

  it('succeeded stores the paper and transitions to done', () => {
    const store = makeStore();
    store.dispatch(enqueued({ assignmentId: 'abc-123' }));
    store.dispatch(succeeded({ paper: samplePaper }));
    const state = store.getState().generation;
    expect(state.status).toBe('done');
    expect(state.paper).toEqual(samplePaper);
    expect(state.error).toBeNull();
  });

  it('failed stores the error message and transitions to failed', () => {
    const store = makeStore();
    store.dispatch(enqueued({ assignmentId: 'abc-123' }));
    store.dispatch(failed({ error: 'LLM timed out' }));
    const state = store.getState().generation;
    expect(state.status).toBe('failed');
    expect(state.error).toBe('LLM timed out');
  });

  it('resetGeneration returns to initial state', () => {
    const store = makeStore();
    store.dispatch(enqueued({ assignmentId: 'abc-123' }));
    store.dispatch(succeeded({ paper: samplePaper }));
    store.dispatch(resetGeneration());
    const state = store.getState().generation;
    expect(state.status).toBe('idle');
    expect(state.assignmentId).toBeNull();
    expect(state.paper).toBeNull();
  });
});
