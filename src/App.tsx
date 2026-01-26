import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { initNetlifyIdentity, onLogout } from './lib/netlifyIdentity';
import Landing from './pages/Landing';
import Login from './pages/Login';
import DocsIntake from './pages/DocsIntake';
import ProtectedRoute from './components/ProtectedRoute';
import TopBar from './components/TopBar';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      {children}
    </>
  );
}

function App() {
  useEffect(() => {
    // Initialize Netlify Identity on app load
    initNetlifyIdentity();

    // Handle logout - refresh page to clear state
    onLogout(() => {
      window.location.href = '/';
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DocsIntake />
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
