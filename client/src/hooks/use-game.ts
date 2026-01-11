import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type CompleteNodeRequest, type StartNodeRequest } from "@shared/routes";

export function useMapData() {
  return useQuery({
    queryKey: [api.map.get.path],
    queryFn: async () => {
      const res = await fetch(api.map.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch map data");
      return api.map.get.responses[200].parse(await res.json());
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useStartNode() {
  return useMutation({
    mutationFn: async (data: StartNodeRequest) => {
      const validated = api.game.startNode.input.parse(data);
      const res = await fetch(api.game.startNode.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 403) throw new Error("Node is locked!");
        throw new Error("Failed to start node");
      }
      return api.game.startNode.responses[200].parse(await res.json());
    },
  });
}

export function useCompleteNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CompleteNodeRequest) => {
      const validated = api.game.completeNode.input.parse(data);
      const res = await fetch(api.game.completeNode.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to complete node");
      return api.game.completeNode.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      // Update the user profile cache with new rewards/unlocks
      queryClient.setQueryData([api.user.getProfile.path], data.newProfileState);
      // Invalidate map data if needed (though map structure is static, unlock status is in profile)
    },
  });
}
