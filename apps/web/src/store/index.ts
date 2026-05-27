import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import assignmentFormReducer from './slices/assignmentFormSlice';
import generationReducer from './slices/generationSlice';
import assignmentsReducer from './slices/assignmentsSlice';

/**
 * Per-request store factory (App Router pattern) — avoids sharing state across
 * requests on the server. The `StoreProvider` creates one instance per client.
 */
export const makeStore = () =>
  configureStore({
    reducer: {
      ui: uiReducer,
      assignmentForm: assignmentFormReducer,
      generation: generationReducer,
      assignments: assignmentsReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
