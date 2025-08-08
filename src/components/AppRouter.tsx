import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '@/pages/Index';
import TicketsPage from '@/pages/TicketsPage';
import CreateTicketPage from '@/pages/CreateTicketPage';
import TicketDetailPage from '@/pages/TicketDetailPage';
import MapPage from '@/pages/MapPage';
import ProfilePage from '@/pages/ProfilePage';
import AdminSettingsPage from '@/pages/AdminSettingsPage';
import EngineersPage from '@/pages/EngineersPage';
import NotFound from '@/pages/NotFound';
import BottomNavigation from '@/components/BottomNavigation';
import { useAuth } from '@/hooks/useAuth';
import AuthForm from '@/components/AuthForm';
import { ThemeProvider } from '@/components/theme-provider';
import ThemeToggle from '@/components/ThemeToggle';
import OfflineIndicator from '@/components/OfflineIndicator';
import { Button } from '@/components/ui/button';
import { LogOut, Shield, User } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/hooks/useUserRole';
import NotificationBell from '@/components/NotificationBell';

export default function AppRouter() {
  const { user, loading, signOut } = useAuth();
  const { profile, loading: profileLoading, isAdmin } = useUserRole(user);

  if (loading || profileLoading) {
    return (
      <div className="app-container flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <div className="app-container relative">
          <div className="absolute top-4 right-4 z-10">
            <ThemeToggle />
          </div>
          <AuthForm onAuthSuccess={() => {}} />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <div className="app-container">
        <Router>
          <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex items-center justify-between p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                <h1 className="text-lg md:text-xl font-bold text-gradient truncate">Field Engineer Portal</h1>
                <Badge variant={isAdmin ? "default" : "secondary"} className="text-xs hidden sm:flex">
                  {isAdmin ? <Shield className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                  {isAdmin ? 'Admin' : 'User'}
                </Badge>
              </div>
              <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                <OfflineIndicator />
                <NotificationBell />
                <ThemeToggle />
                <Button variant="ghost" size="sm" onClick={signOut} className="hover:bg-destructive/10">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </header>
          
          <main className="pb-safe min-h-[calc(100vh-140px)]">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
              <Route path="/create" element={<CreateTicketPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/engineers" element={<EngineersPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          
          <BottomNavigation />
        </Router>
      </div>
    </ThemeProvider>
  );
}
