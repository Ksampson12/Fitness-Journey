import type { Express, Request } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Integrations
  await setupAuth(app);
  registerAuthRoutes(app);
  registerChatRoutes(app);
  registerImageRoutes(app);

  // Seed Map Data
  await storage.seedMapData();

  // Middleware to check auth for game routes
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // === User Routes ===
  app.get(api.user.getProfile.path, requireAuth, async (req: any, res) => {
    const profile = await storage.getUserProfile(req.user.claims.sub);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.json(profile);
  });

  app.post(api.user.updateOnboarding.path, requireAuth, async (req: any, res) => {
    try {
      const input = api.user.updateOnboarding.input.parse(req.body);
      const userId = req.user.claims.sub;
      
      let profile = await storage.getUserProfile(userId);
      
      const initialNodes = ["z1-n1"]; // Unlock first node
      
      if (profile) {
        profile = await storage.updateUserProfile(userId, {
          ...input,
          unlockedNodeIds: profile.unlockedNodeIds.length ? profile.unlockedNodeIds : initialNodes
        });
      } else {
        profile = await storage.createUserProfile({
          userId,
          ...input,
          currentNodeId: "z1-n1",
          unlockedNodeIds: initialNodes,
          completedNodeIds: [],
          xp: 0,
          coins: 0,
          streak: 0,
          avatarArchetype: input.avatarArchetype,
          evolutionStage: 1,
          equippedItems: [],
        });
      }
      
      res.json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.user.updateProfile.path, requireAuth, async (req: any, res) => {
    try {
      const input = api.user.updateProfile.input.parse(req.body);
      const userId = req.user.claims.sub;
      
      const profile = await storage.updateUserProfile(userId, input);
      res.json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === Map Routes ===
  app.get(api.map.get.path, async (req, res) => {
    const nodes = await storage.getMapNodes();
    const zones = await storage.getMapZones();
    res.json({ nodes, zones });
  });

  // === Game Routes ===
  app.post(api.game.startNode.path, requireAuth, async (req: any, res) => {
    try {
      const { nodeId } = api.game.startNode.input.parse(req.body);
      const userId = req.user.claims.sub;

      const profile = await storage.getUserProfile(userId);
      if (!profile || !profile.unlockedNodeIds.includes(nodeId)) {
        return res.status(403).json({ message: "Node locked or profile missing" });
      }

      // Check for existing active workout
      let workout = await storage.findActiveWorkout(userId, nodeId);

      if (!workout) {
        // Generate new workout via AI or Template
        // For MVP, we'll try AI generation with a fallback
        const nodes = await storage.getMapNodes();
        const node = nodes.find(n => n.id === nodeId);
        
        let workoutJson = {
          title: "Quick Workout",
          exercises: [
            { name: "Jumping Jacks", duration: "60s", reps: null },
            { name: "Pushups", duration: null, reps: "10" }
          ]
        };

        try {
          // Attempt AI generation
          if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
             const completion = await openai.chat.completions.create({
               model: "gpt-5.1",
               messages: [
                 { role: "system", content: "You are a fitness trainer. Generate a JSON workout based on user stats and node type. Response format: { title: string, exercises: { name: string, duration?: string, reps?: string, sets?: number }[] }" },
                 { role: "user", content: `Node: ${node?.name}, Type: ${node?.type}, Difficulty: ${node?.difficulty}. User Level: ${profile.fitnessLevel}. Equipment: ${profile.equipment}` }
               ],
               response_format: { type: "json_object" }
             });
             const content = completion.choices[0].message.content;
             if (content) {
               workoutJson = JSON.parse(content);
             }
          }
        } catch (e) {
          console.error("AI Generation failed, using template", e);
        }

        workout = await storage.createWorkout({
          userId,
          nodeId,
          source: "ai",
          workoutJson,
        });
      }

      const allNodes = await storage.getMapNodes();
      const node = allNodes.find(n => n.id === nodeId);

      res.json({
        workoutId: workout.id,
        workout: workout.workoutJson,
        node
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.game.completeNode.path, requireAuth, async (req: any, res) => {
    try {
      const { workoutId, metrics } = api.game.completeNode.input.parse(req.body);
      const userId = req.user.claims.sub;

      const workout = await storage.getWorkout(workoutId);
      if (!workout || workout.userId !== userId) {
        return res.status(404).json({ message: "Workout not found" });
      }

      // Complete workout
      await storage.completeWorkout(workoutId, metrics);

      // Update User Profile (Rewards)
      const profile = await storage.getUserProfile(userId);
      if (!profile) return res.status(404).json({ message: "Profile not found" });

      const nodes = await storage.getMapNodes();
      const currentNode = nodes.find(n => n.id === workout.nodeId);
      
      const xpGain = 100 * (currentNode?.difficulty || 1);
      const coinsGain = 10 * (currentNode?.difficulty || 1);
      
      // Determine new unlocks
      // Simple logic: If we just completed node X, unlock any node that has X as prerequisite
      let newUnlockedNodes: string[] = [...profile.unlockedNodeIds];
      
      // Mark current as completed
      const newCompletedNodes = [...new Set([...profile.completedNodeIds, workout.nodeId])];
      
      // Find nodes that have this node as prerequisite
      const nextNodes = nodes.filter(n => n.prerequisites?.includes(workout.nodeId));
      nextNodes.forEach(n => {
        if (!newUnlockedNodes.includes(n.id)) {
          newUnlockedNodes.push(n.id);
        }
      });

      const updatedProfile = await storage.updateUserProfile(userId, {
        xp: profile.xp + xpGain,
        coins: profile.coins + coinsGain,
        streak: profile.streak + 1, // Simplified streak logic
        completedNodeIds: newCompletedNodes,
        unlockedNodeIds: newUnlockedNodes,
        lastActiveDate: new Date(),
      });

      res.json({
        success: true,
        rewards: {
          xp: xpGain,
          coins: coinsGain,
          unlockedNodes: nextNodes.map(n => n.id),
          evolutionTriggered: false // Todo: Add evolution logic
        },
        newProfileState: updatedProfile
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.game.quickFit.path, requireAuth, async (req: any, res) => {
    try {
      const { duration, focus, intensity, mood } = api.game.quickFit.input.parse(req.body);
      const userId = req.user.claims.sub;
      const profile = await storage.getUserProfile(userId);

      let workoutJson = {
        title: `Quick ${duration}min ${focus}`,
        exercises: [
           { name: "Jumping Jacks", duration: "60s", reps: null },
           { name: "Burpees", duration: null, reps: "15" }
        ]
      };

      try {
        if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
           const systemPrompt = `You are an expert personal trainer creating a ${duration}-minute "QuickFit" workout.
           User Profile: Level ${profile?.fitnessLevel}, Equipment: ${profile?.equipment?.join(', ') || 'None'}.
           Session Goals: Focus: ${focus}, Intensity: ${intensity}, Mood: ${mood || 'Neutral'}.
           Generate a structured JSON workout plan.`;
           
           const completion = await openai.chat.completions.create({
             model: "gpt-5.1",
             messages: [
               { role: "system", content: systemPrompt },
               { role: "user", content: "Generate workout JSON: { title: string, exercises: { name: string, duration?: string, reps?: string, sets?: number, notes?: string }[] }" }
             ],
             response_format: { type: "json_object" }
           });
           const content = completion.choices[0].message.content;
           if (content) {
             workoutJson = JSON.parse(content);
           }
        }
      } catch (e) {
        console.error("AI Generation failed, using template", e);
      }

      // We use "quick-fit" as a special node ID
      const workout = await storage.createWorkout({
        userId,
        nodeId: "quick-fit",
        source: "quick-fit-ai",
        workoutJson,
      });

      res.json({
        workoutId: workout.id,
        workout: workout.workoutJson
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
