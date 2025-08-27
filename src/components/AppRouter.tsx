import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Dashboard from '@/pages/Index';
import TicketsPage from '@/pages/TicketsPage';
import CreateTicketPage from '@/pages/CreateTicketPage';
import TicketDetailPage from '@/pages/TicketDetailPage';
import MapPage from '@/pages/MapPage';
import ProfilePage from '@/pages/ProfilePage';
import AdminSettingsPage from '@/pages/AdminSettingsPage';
import EngineersPage from '@/pages/EngineersPage';
import ResolvedTicketsPage from '@/pages/ResolvedTicketsPage';
import NotFound from '@/pages/NotFound';
import AppLayout from '@/components/AppLayout';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import AuthForm from '@/components/AuthForm';
import { ThemeProvider } from '@/components/theme-provider';
import ThemeToggle from '@/components/ThemeToggle';
import { Loader2 } from 'lucide-react';

// Auth component for the /auth route
function AuthPage() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex items-center justify-center relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <AuthForm onAuthSuccess={() => navigate('/')} />
    </div>
  );
}

export default function AppRouter() {
  const { user, loading } = useFirebaseAuth();

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Router>
        {loading ? (
          <div className="h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Routes>
            {/* Authentication route - accessible when not logged in */}
            <Route
              path="/auth"
              element={
                !user ? <AuthPage /> : <Navigate to="/" replace />
              }
            />

            {/* Protected routes - require authentication */}
            {user ? (
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Navigate to="/" replace />} />
                <Route path="tickets" element={<TicketsPage />} />
                <Route path="tickets/:id" element={<TicketDetailPage />} />
                <Route path="create" element={<CreateTicketPage />} />
                <Route path="map" element={<MapPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="profile/:userId" element={<ProfilePage />} />
                <Route path="engineers" element={<EngineersPage />} />
                <Route path="admin/resolved-tickets" element={<ResolvedTicketsPage />} />
                <Route path="admin/settings" element={<AdminSettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            ) : (
              // Redirect all other routes to auth when not logged in
              <Route path="*" element={<Navigate to="/auth" replace />} />
            )}
          </Routes>
        )}
      </Router>
    </ThemeProvider>
  );
}
