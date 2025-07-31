import React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import AuthForm from '@/components/AuthForm';
import MobileTicketApp from '@/components/MobileTicketApp';
import ThemeToggle from '@/components/ThemeToggle';
import OfflineIndicator from '@/components/OfflineIndicator';
import { Button } from '@/components/ui/button';
import { LogOut, Shield, User } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function App() {
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
        <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gradient">Field Engineer Portal</h1>
              <Badge variant={isAdmin ? "default" : "secondary"} className="text-xs">
                {isAdmin ? <Shield className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                {isAdmin ? 'Admin' : 'User'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <OfflineIndicator />
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={signOut} className="hover:bg-destructive/10">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>
        <main className="pb-safe">
          <MobileTicketApp userRole={profile?.user_role || 'user'} />
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;