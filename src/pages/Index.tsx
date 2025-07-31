import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import FieldEngineerDashboard from '@/components/dashboards/FieldEngineerDashboard';
import SupervisorDashboard from '@/components/dashboards/SupervisorDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import { Loader2 } from 'lucide-react';

const Index: React.FC = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-4 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto p-4 text-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  // Route to appropriate dashboard based on user role
  switch (profile.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'supervisor':
      return <SupervisorDashboard />;
    case 'field_engineer':
    default:
      return <FieldEngineerDashboard />;
  }
};

export default Index;
