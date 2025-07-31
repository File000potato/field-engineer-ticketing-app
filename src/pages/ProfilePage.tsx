import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  Shield, 
  Settings, 
  Bell,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  Download,
  Upload,
  LogOut,
  Mail,
  Calendar,
  MapPin
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { toast } from '@/components/ui/use-toast';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { isAdmin, profile } = useUserRole(user);
  const isOnline = useOnlineStatus();
  const { theme, setTheme } = useTheme();
  
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [locationTracking, setLocationTracking] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleExportData = () => {
    // Mock data export
    const data = {
      user: user?.email,
      exportDate: new Date().toISOString(),
      tickets: [], // Would contain user's tickets
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `field-engineer-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Data exported',
      description: 'Your data has been downloaded successfully.',
    });
  };

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account and app preferences
        </p>
      </div>

      {/* User Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-lg">
                {user?.email ? getUserInitials(user.email) : <User className="w-6 h-6" />}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1 flex-1">
              <h3 className="font-semibold">{user?.email || 'Unknown User'}</h3>
              <div className="flex items-center gap-2">
                <Badge variant={isAdmin ? "default" : "secondary"} className="text-xs">
                  {isAdmin ? <Shield className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                  {isAdmin ? 'Admin' : 'Field Engineer'}
                </Badge>
                <Badge variant={isOnline ? "default" : "destructive"} className="text-xs">
                  {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              value={user?.email || ''} 
              disabled 
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input 
              id="role" 
              value={isAdmin ? 'Administrator' : 'Field Engineer'} 
              disabled 
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="joined">Member Since</Label>
            <Input 
              id="joined" 
              value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'} 
              disabled 
              className="bg-muted"
            />
          </div>
        </CardContent>
      </Card>

      {/* App Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5" />
            App Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Dark Mode</Label>
              <p className="text-xs text-muted-foreground">
                Switch between light and dark themes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4" />
              <Switch 
                checked={theme === 'dark'} 
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
              <Moon className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Push Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive updates about ticket assignments
              </p>
            </div>
            <Switch 
              checked={notifications} 
              onCheckedChange={setNotifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Auto Sync</Label>
              <p className="text-xs text-muted-foreground">
                Automatically sync when online
              </p>
            </div>
            <Switch 
              checked={autoSync} 
              onCheckedChange={setAutoSync}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Location Tracking</Label>
              <p className="text-xs text-muted-foreground">
                Allow location access for field work
              </p>
            </div>
            <Switch 
              checked={locationTracking} 
              onCheckedChange={setLocationTracking}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="w-5 h-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            onClick={handleExportData}
            className="w-full justify-start"
          >
            <Download className="w-4 h-4 mr-2" />
            Export My Data
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Mock sync action
                toast({
                  title: 'Sync started',
                  description: 'Syncing your data...',
                });
              }}
            >
              <Upload className="w-3 h-3 mr-1" />
              Sync Now
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Mock cache clear
                toast({
                  title: 'Cache cleared',
                  description: 'Local cache has been cleared.',
                });
              }}
            >
              <Settings className="w-3 h-3 mr-1" />
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Support & Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Support & Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">App Version</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Sync</span>
              <span>{isOnline ? 'Just now' : 'Offline'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Storage Used</span>
              <span>2.4 MB</span>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => {
                toast({
                  title: 'Coming soon',
                  description: 'Support center will be available soon.',
                });
              }}
            >
              <Mail className="w-3 h-3 mr-2" />
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card className="border-destructive/20">
        <CardContent className="pt-6">
          <Button 
            variant="destructive" 
            onClick={handleSignOut}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
