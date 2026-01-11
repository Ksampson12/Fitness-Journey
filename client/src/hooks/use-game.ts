import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useAuth } from "@/hooks/use-auth";

// GET /api/map
export function useGameMap() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [api.map.get.path],
    queryFn: async () => {
      const res = await fetch(api.map.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch map");
      return api.map.get.responses[200].parse(await res.json());
    },
    enabled: isAuthenticated,
  });
}

// POST /api/game/start-node
export function useStartNode() {
  return useMutation({
    mutationFn: async (data: { nodeId: string }) => {
      const validated = api.game.startNode.input.parse(data);
      const res = await fetch(api.game.startNode.path, {
        method: api.game.startNode.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 403) throw new Error("Level locked or requirement not met");
        throw new Error("Failed to start node");
      }
      return api.game.startNode.responses[200].parse(await res.json());
    },
  });
}

// POST /api/game/complete-node
export function useCompleteNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: typeof api.game.completeNode.input._type) => {
      const validated = api.game.completeNode.input.parse(data);
      const res = await fetch(api.game.completeNode.path, {
        method: api.game.completeNode.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to complete node");
      return api.game.completeNode.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.user.getProfile.path] });
      queryClient.invalidateQueries({ queryKey: [api.map.get.path] });
    },
  });
}
