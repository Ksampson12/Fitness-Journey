import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";

type EmailAuthStatus = {
  authenticated: boolean;
  email?: string;
  userId?: string;
  needsReverification?: boolean;
};

type AuthState = {
  source: "replit" | "email" | null;
  userId: string | null;
  email?: string;
  user?: User;
  needsReverification?: boolean;
};

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
    const response = await fetch("/api/auth/email/status", {
      credentials: "include",
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
  // Check Replit auth first
  const replitUser = await fetchReplitUser();
  if (replitUser) {
    return {
      source: "replit",
      userId: replitUser.id,
      email: replitUser.email ?? undefined,
      user: replitUser,
    };
  }

  // Check email auth
  const emailStatus = await fetchEmailAuthStatus();
  if (emailStatus?.authenticated) {
    return {
      source: "email",
      userId: emailStatus.userId ?? null,
      email: emailStatus.email,
      needsReverification: emailStatus.needsReverification,
    };
  }

  return { source: null, userId: null };
}

async function logout(): Promise<void> {
  // Try email logout first (silent), then redirect to Replit logout
  try {
    await fetch("/api/auth/email/logout", {
      method: "POST",
      credentials: "include",
    });
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
