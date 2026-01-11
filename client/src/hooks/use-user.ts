import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useAuth } from "@/hooks/use-auth";

// GET /api/user/profile
export function useUserProfile() {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: [api.user.getProfile.path],
    queryFn: async () => {
      const res = await fetch(api.user.getProfile.path, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch profile");
      // Schema is z.any() for now in manifest, but strictly it returns UserProfile
      return await res.json();
    },
    enabled: isAuthenticated,
    retry: false,
  });
}

// POST /api/user/onboarding
export function useUpdateOnboarding() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: typeof api.user.updateOnboarding.input._type) => {
      const validated = api.user.updateOnboarding.input.parse(data);
      const res = await fetch(api.user.updateOnboarding.path, {
        method: api.user.updateOnboarding.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to update onboarding");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.user.getProfile.path] });
    },
  });
}

// PATCH /api/user/profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: typeof api.user.updateProfile.input._type) => {
      const validated = api.user.updateProfile.input.parse(data);
      const res = await fetch(api.user.updateProfile.path, {
        method: api.user.updateProfile.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to update profile");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.user.getProfile.path] });
    },
  });
}
