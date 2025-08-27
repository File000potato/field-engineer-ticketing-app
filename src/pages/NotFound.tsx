import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { Button } from "@/components/ui/button";
import { Home, LogIn } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useFirebaseAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8 rounded-lg border border-border bg-card shadow-md animate-slide-in">
        <h1 className="text-5xl font-bold mb-6 text-primary">404</h1>
        <p className="text-xl text-card-foreground mb-6">Page not found</p>
        <p className="text-sm text-muted-foreground mb-8">
          The page <code className="bg-muted px-1 py-0.5 rounded text-xs">{location.pathname}</code> could not be found.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {user ? (
            <Button onClick={() => navigate('/')} className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Return to Dashboard
            </Button>
          ) : (
            <Button onClick={() => navigate('/auth')} className="flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              Go to Sign In
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
