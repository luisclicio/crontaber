import '@mantine/core/styles.css';
import '@mantine/code-highlight/styles.css';

import { AppShell, MantineProvider } from '@mantine/core';
import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';

import { IndexPage } from './pages/Index';
import { JobPage } from './pages/Job';

export function App() {
  return (
    <HashRouter>
      <MantineProvider defaultColorScheme="dark">
        <Routes>
          <Route
            path="/"
            element={
              <AppShell p="md">
                <Outlet />
              </AppShell>
            }
          >
            <Route index element={<IndexPage />} />
            <Route path="job/:id" element={<JobPage />} />
          </Route>
        </Routes>
      </MantineProvider>
    </HashRouter>
  );
}
