import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import DocsIntake from './pages/DocsIntake';
import IntakeSummary from './pages/IntakeSummary';
import DocumentLocker from './pages/DocumentLocker';
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
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

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
          <Route
            path="/intake/:intakeId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <IntakeSummary />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/intake/:intakeId/uploads"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DocumentLocker />
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
