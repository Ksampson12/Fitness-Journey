import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";

type EmailAuthStatus = {
  authenticated: boolean;
  email?: string;
  userId?: string;
  needsReverification?: boolean;
};

type AuthState = {
  source: "replit" | "email" | "jwt" | null;
  userId: string | null;
  email?: string;
  user?: User;
  needsReverification?: boolean;
};

// JWT Helper Functions
function verifyJwtToken(token: string) {
  try {
    // Simple client-side verification (for testing)
    // In production, you'd verify server-side
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (error) {
    return null;
  }
}

async function fetchReplitUser(): Promise<User | null> {
  const response = await fetch("/api/auth/user", {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function fetchEmailAuthStatus(): Promise<EmailAuthStatus | null> {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    
    const response = await fetch("/api/auth/email/status", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

async function fetchAuthState(): Promise<AuthState> {
  // Try JWT from URL params first (after magic link login)
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  const refreshFromUrl = urlParams.get('refresh');
  
  if (tokenFromUrl && refreshFromUrl) {
    // Store tokens and clean URL
    localStorage.setItem('accessToken', tokenFromUrl);
    localStorage.setItem('refreshToken', refreshFromUrl);
    window.history.replaceState({}, '', window.location.pathname);
  }
  
  // Try to get current user with JWT
  const token = localStorage.getItem('accessToken');
  if (token) {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const user = await res.json();
        return {
          source: "jwt",
          userId: user.id,
          email: user.email,
          needsReverification: false, // Always false now
        };
      }
    } catch (error) {
      // Token invalid, try refresh
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const refreshRes = await fetch("/api/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken })
          });
          
          if (refreshRes.ok) {
            const tokens = await refreshRes.json();
            localStorage.setItem('accessToken', tokens.accessToken);
            localStorage.setItem('refreshToken', tokens.refreshToken);
            
            // Retry with new token
            const userRes = await fetch("/api/auth/me", {
              headers: { Authorization: `Bearer ${tokens.accessToken}` }
            });
            
            if (userRes.ok) {
              const user = await userRes.json();
              return {
                source: "jwt",
                userId: user.id,
                email: user.email,
                needsReverification: false, // Always false now
              };
            }
          }
        } catch (error) {
          console.error("Token refresh failed", error);
        }
      }
      
      // Clear invalid tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }
  
  // Check Replit auth as fallback
  const replitUser = await fetchReplitUser();
  if (replitUser) {
    return {
      source: "replit",
      userId: replitUser.id,
      email: replitUser.email ?? undefined,
      user: replitUser,
    };
  }

  return { source: null, userId: null };
}

async function logout(): Promise<void> {
  // Clear local tokens
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  
  // Try email logout first (silent), then redirect to Replit logout
  try {
    const token = localStorage.getItem('accessToken');
    if (token) {
      await fetch("/api/auth/email/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  } catch {}
  window.location.href = "/api/logout";
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: authState, isLoading } = useQuery<AuthState>({
    queryKey: ["/api/auth/state"],
    queryFn: fetchAuthState,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/state"], { source: null, userId: null });
    },
  });

  return {
    user: authState?.user,
    userId: authState?.userId,
    email: authState?.email,
    authSource: authState?.source,
    needsReverification: authState?.needsReverification,
    isLoading,
    isAuthenticated: !!authState?.source,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
