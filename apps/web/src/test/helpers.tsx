/**
 * RTL test helpers — provides a `renderWithStore` utility that wraps the
 * rendered tree in a fresh Redux StoreProvider, matching the production
 * App Router setup.
 */
import { render, type RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { makeStore, type AppStore } from '@/store/index';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  store?: AppStore;
}

export function renderWithStore(
  ui: React.ReactElement,
  { store = makeStore(), ...options }: ExtendedRenderOptions = {},
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...options }) };
}
