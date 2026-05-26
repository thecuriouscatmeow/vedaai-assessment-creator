'use client';
import { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore, type AppStore } from './index';

/** Creates a single store instance per client and provides it to the tree. */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }
  return <Provider store={storeRef.current}>{children}</Provider>;
}
