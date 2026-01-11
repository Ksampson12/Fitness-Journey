import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type UserProfile, type OnboardingRequest } from "@shared/routes";

export function useUserProfile() {
  return useQuery({
    queryKey: [api.user.getProfile.path],
    queryFn: async () => {
      const res = await fetch(api.user.getProfile.path, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch profile");
      return api.user.getProfile.responses[200].parse(await res.json());
    },
    // Don't retry on 404s as it means user just needs onboarding
    retry: (failureCount, error: any) => {
      if (error?.message?.includes("404")) return false;
      return failureCount < 3;
    }
  });
}

export function useUpdateOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: OnboardingRequest) => {
      const validated = api.user.updateOnboarding.input.parse(data);
      const res = await fetch(api.user.updateOnboarding.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update onboarding");
      return api.user.updateOnboarding.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.setQueryData([api.user.getProfile.path], data);
    },
  });
}
