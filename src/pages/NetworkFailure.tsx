/**
 * @fileoverview Network Failure page displayed when Firebase services are unavailable
 * @author Field Engineer Portal Team
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  WifiOff, 
  RefreshCw, 
  Settings, 
  AlertTriangle,
  Cloud,
  Server
} from 'lucide-react';

interface NetworkFailureProps {
  onRetry?: () => void;
  error?: string;
}

export default function NetworkFailure({ onRetry, error }: NetworkFailureProps) {
  const handleRefresh = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10">
            <WifiOff className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Network Connection Failed</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Unable to connect to Firebase services. Please check your network connection and try again.
          </p>
          
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs text-left">
                <strong>Technical Details:</strong><br />
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-3 pt-2">
            <Button onClick={handleRefresh} className="w-full" size="lg">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <div className="text-xs text-muted-foreground space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Cloud className="w-3 h-3" />
                <span>Checking Firebase connectivity...</span>
              </div>
            </div>
          </div>
          
          {/* Troubleshooting Section */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3 flex items-center justify-center gap-2">
              <Settings className="w-4 h-4" />
              Troubleshooting Steps
            </h4>
            
            <div className="text-xs text-muted-foreground text-left space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-mono bg-muted px-1 py-0.5 rounded text-xs">1.</span>
                <span>Check your internet connection</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono bg-muted px-1 py-0.5 rounded text-xs">2.</span>
                <span>Verify Firebase configuration is correct</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono bg-muted px-1 py-0.5 rounded text-xs">3.</span>
                <span>Contact your system administrator if the problem persists</span>
              </div>
            </div>
          </div>
          
          {/* Status Indicators */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                <Server className="w-3 h-3 text-destructive" />
                <span className="text-destructive">Firebase</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                <WifiOff className="w-3 h-3 text-destructive" />
                <span className="text-destructive">Network</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
