import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-user";

import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Onboarding from "@/pages/Onboarding";
import QuickFit from "@/pages/QuickFit";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  if (authLoading) return <div className="min-h-screen bg-background" />; // Loading state

  if (!isAuthenticated) {
    return <Redirect to="/landing" />;
  }

  // If authenticated but no profile, force onboarding
  // We skip this check if we are ALREADY on the onboarding page
  if (!profileLoading && !profile && window.location.pathname !== "/onboarding") {
    return <Redirect to="/onboarding" />;
  }
  
  // If we have profile and try to access onboarding, go home
  if (!profileLoading && profile && window.location.pathname === "/onboarding") {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <Switch>
      <Route path="/landing">
        {isAuthenticated ? <Redirect to="/" /> : <Landing />}
      </Route>
      
      {/* Protected Routes */}
      <Route path="/">
        <ProtectedRoute component={Home} />
      </Route>
      <Route path="/onboarding">
        <ProtectedRoute component={Onboarding} />
      </Route>
      <Route path="/quickfit">
        <ProtectedRoute component={QuickFit} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      
      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
