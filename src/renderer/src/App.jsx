import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';
import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';

import { IndexPage } from './pages/Index';

export function App() {
  return (
    <HashRouter>
      <MantineProvider>
        <Routes>
          <Route path="/" element={<Outlet />}>
            <Route index element={<IndexPage />} />
          </Route>
        </Routes>
      </MantineProvider>
    </HashRouter>
  );
}
