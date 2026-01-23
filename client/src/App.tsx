import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-user";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Onboarding from "@/pages/Onboarding";
import QuickFit from "@/pages/QuickFit";
import Goals from "@/pages/Goals";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import PlanReveal from "@/pages/PlanReveal";
import EmailLogin from "@/pages/EmailLogin";
import Admin from "@/admin";
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
  
  // If we have profile and try to access onboarding, go home (unless we want to allow re-onboarding manually?)
  // Actually, we should allow /plan-reveal if profile exists
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
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/" /> : <EmailLogin />}
      </Route>
      
      {/* Protected Routes */}
      <Route path="/">
        <ProtectedRoute component={Home} />
      </Route>
      <Route path="/onboarding">
        <ProtectedRoute component={Onboarding} />
      </Route>
      <Route path="/plan-reveal">
        <ProtectedRoute component={PlanReveal} />
      </Route>
      <Route path="/quickfit">
        <ProtectedRoute component={QuickFit} />
      </Route>
      <Route path="/goals">
        <ProtectedRoute component={Goals} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      <Route path="/admin">
        <Admin />
      </Route>
      
      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function ReverificationWrapper({ children }: { children: React.ReactNode }) {
  // Always show children - no verification needed
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-md px-4 sm:px-6">
          <ReverificationWrapper>
            <Router />
          </ReverificationWrapper>
          <PWAInstallPrompt />
        </div>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
