import type { Express, Request } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { registerEmailAuthRoutes } from "./email-auth";
import OpenAI from "openai";
import webpush from "web-push";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:fitness@example.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

function calculateStreak(
  currentStreak: number, 
  lastActiveDate: Date | null,
  weeklyPlan?: any
): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (!lastActiveDate) {
    return 1;
  }
  
  const lastActive = new Date(lastActiveDate);
  const lastActiveDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
  
  const diffTime = today.getTime() - lastActiveDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return currentStreak;
  } else if (diffDays === 1) {
    return currentStreak + 1;
  } else {
    // Check if the missed days were rest days in the weekly plan
    if (weeklyPlan?.schedule) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      let allMissedDaysAreRestDays = true;
      
      // Check each missed day
      for (let i = 1; i < diffDays; i++) {
        const missedDate = new Date(lastActiveDay.getTime() + i * 24 * 60 * 60 * 1000);
        const missedDayName = dayNames[missedDate.getDay()];
        
        // Find the corresponding day in the schedule
        const scheduleDay = weeklyPlan.schedule.find((d: any) => 
          d.day?.toLowerCase().includes(missedDayName.toLowerCase())
        );
        
        // Check if it's a rest/recovery day
        const isRestDay = scheduleDay?.focus?.toLowerCase().includes('rest') || 
                          scheduleDay?.focus?.toLowerCase().includes('recovery') ||
                          scheduleDay?.notes?.toLowerCase().includes('no heavy work');
        
        if (!isRestDay) {
          allMissedDaysAreRestDays = false;
          break;
        }
      }
      
      if (allMissedDaysAreRestDays) {
        // All missed days were rest days, continue the streak
        return currentStreak + 1;
      }
    }
    
    // Missed a workout day, reset streak
    return 1;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Integrations
  await setupAuth(app);
  registerAuthRoutes(app);
  registerChatRoutes(app);
  registerImageRoutes(app);
  registerEmailAuthRoutes(app);

  // Seed Map Data
  await storage.seedMapData();

  // === User Routes ===
  app.get(api.user.getProfile.path, async (req: any, res) => {
    // Try to get the actual profile from storage
    const userId = "test-user"; // Hardcoded for now
    const profile = await storage.getUserProfile(userId);
    
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    
    res.json(profile);
  });

  app.post(api.user.updateOnboarding.path, async (req: any, res) => {
    try {
      const input = api.user.updateOnboarding.input.parse(req.body);
      const userId = "test-user"; // Hardcoded for now
      
      let profile = await storage.getUserProfile(userId);
      
      const initialNodes = ["z1-n1"]; // Unlock first node
      
      // AI Generation for Weekly Plan
      let weeklyPlan = null;
      try {
        if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
           const systemPrompt = `You are an expert personal trainer. Create a DETAILED 7-day weekly workout plan for a new client.
           Client: ${input.displayName}, Level: ${input.fitnessLevel}, Goal: ${input.goals.join(', ')}.
           Equipment: ${input.equipment.join(', ')}. Activities: ${input.activities.join(', ')}.
           
           You must generate the specific exercises for EACH workout day.
           The 'explanation' should briefly explain how this specific plan was tailored to their goals (e.g. "Because you chose Strength and have Dumbbells, we focused on...").
           
           Response JSON format: { 
             schedule: { 
               day: string, 
               focus: string, 
               duration: string, 
               notes: string,
               exercises: { name: string, duration?: string, reps?: string, sets?: number, notes?: string }[]
             }[], 
             motivation: string,
             trainerNote: string,
             explanation: string
           }`;
           
           const completion = await openai.chat.completions.create({
             model: "gpt-5.1",
             messages: [
               { role: "system", content: systemPrompt },
               { role: "user", content: "Generate detailed weekly plan." }
             ],
             response_format: { type: "json_object" }
           });
           const content = completion.choices[0].message.content;
           if (content) {
             weeklyPlan = JSON.parse(content);
           }
        }
      } catch (e) {
        console.error("AI Plan Generation failed", e);
        // Fallback plan
        weeklyPlan = {
          schedule: [
            { 
              day: "Monday", 
              focus: "Full Body Start", 
              duration: "30m", 
              notes: "Kick off the week strong",
              exercises: [
                { name: "Jumping Jacks", duration: "60s", reps: null, sets: 3 },
                { name: "Pushups", duration: null, reps: "10", sets: 3 }
              ]
            },
            { 
              day: "Wednesday", 
              focus: "Cardio & Core", 
              duration: "30m", 
              notes: "Keep the heart rate up",
              exercises: [
                { name: "High Knees", duration: "45s", reps: null, sets: 3 },
                { name: "Plank", duration: "60s", reps: null, sets: 3 }
              ]
            },
            { 
              day: "Friday", 
              focus: "Strength & Power", 
              duration: "45m", 
              notes: "Finish strong",
              exercises: [
                { name: "Squats", duration: null, reps: "15", sets: 3 },
                { name: "Lunges", duration: null, reps: "12", sets: 3 }
              ]
            }
          ],
          motivation: "Consistency is key. Trust the process and you will see results.",
          trainerNote: "Let's get to work!",
          explanation: "We built this foundation phase to get you moving."
        };
      }

      // The weekly plan serves as a BLUEPRINT - a reusable template that cycles weekly
      // Each node draws from this blueprint based on its position in the user's journey
      // Node 0 -> Day 0, Node 1 -> Day 1, ..., Node 7 -> Day 0 (cycling), etc.
      // This allows infinite map growth while maintaining personalized workouts
      console.log("[Onboarding] Weekly plan created as reusable blueprint for journey progression");

      if (profile) {
        profile = await storage.updateUserProfile(userId, {
          ...input,
          weeklyPlan,
          unlockedNodeIds: profile.unlockedNodeIds.length ? profile.unlockedNodeIds : initialNodes
        });
      } else {
        profile = await storage.createUserProfile({
          userId,
          ...input,
          weeklyPlan,
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

  app.patch(api.user.updateProfile.path, async (req: any, res) => {
    try {
      const input = api.user.updateProfile.input.parse(req.body);
      const userId = "test-user"; // Hardcoded for now
      
      const profile = await storage.updateUserProfile(userId, input);
      res.json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.user.resetProfile.path, async (req: any, res) => {
    try {
      const userId = "test-user"; // Hardcoded for now
      await storage.deleteUserProfile(userId);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === Map Routes ===
  app.get(api.map.get.path, async (req, res) => {
    const nodes = await storage.getMapNodes();
    const zones = await storage.getMapZones();
    res.json({ nodes, zones });
  });

  // === Game Routes ===
  app.post(api.game.startNode.path, async (req: any, res) => {
    try {
      const { nodeId } = api.game.startNode.input.parse(req.body);
      const userId = "test-user"; // Hardcoded for now

      const profile = await storage.getUserProfile(userId);
      if (!profile || !profile.unlockedNodeIds.includes(nodeId)) {
        return res.status(403).json({ message: "Node locked or profile missing" });
      }

      const allNodes = await storage.getMapNodes();
      const node = allNodes.find(n => n.id === nodeId);

      // Check for existing active workout for this node
      let workout = await storage.findActiveWorkout(userId, nodeId);
      
      if (workout) {
        // Return existing workout - user is resuming or replaying
        console.log(`[StartNode] Found existing workout ${workout.id} for node ${nodeId}`);
      } else {
        // Create new workout using the weekly plan as a BLUEPRINT
        // The weekly plan cycles: node 0 -> day 0, node 1 -> day 1, ..., node 7 -> day 0, etc.
        
        let workoutJson: any = {
          title: node?.name || "Workout",
          exercises: [
            { name: "Jumping Jacks", duration: "60s", reps: null },
            { name: "Pushups", duration: null, reps: "10" }
          ]
        };
        let scheduleIndex: number | undefined;

        if (profile.weeklyPlan) {
           const plan = profile.weeklyPlan as any;
           const schedule = plan.schedule || [];
           
           // Get workout days (days with exercises)
           const workoutDays: { day: any, originalIndex: number }[] = [];
           schedule.forEach((day: any, index: number) => {
             if (day.exercises && day.exercises.length > 0) {
               workoutDays.push({ day, originalIndex: index });
             }
           });
           
           if (workoutDays.length > 0) {
             // Sort all nodes globally to find this node's position
             const allZones = await storage.getMapZones();
             const zoneOrderMap = new Map(allZones.map((z: any) => [z.id, z.orderIndex]));
             
             const sortedNodes = [...allNodes]
               .filter((n: any) => n.type === "workout" || n.type === "boss")
               .sort((a: any, b: any) => {
                 const zoneOrderA = zoneOrderMap.get(a.zoneId) ?? 0;
                 const zoneOrderB = zoneOrderMap.get(b.zoneId) ?? 0;
                 if (zoneOrderA !== zoneOrderB) return zoneOrderA - zoneOrderB;
                 return (a.orderIndex || 0) - (b.orderIndex || 0);
               });
             
             // Find this node's global position
             const globalNodeIndex = sortedNodes.findIndex(n => n.id === nodeId);
             
             // Cycle through workout days based on node position
             // This creates a weekly rhythm that repeats as the user progresses
             const dayPosition = globalNodeIndex % workoutDays.length;
             const selectedDay = workoutDays[dayPosition];
             scheduleIndex = selectedDay.originalIndex;
             
             workoutJson = {
               title: `${selectedDay.day.day}: ${selectedDay.day.focus}`,
               exercises: selectedDay.day.exercises,
               duration: selectedDay.day.duration,
               notes: selectedDay.day.notes
             };
             
             console.log(`[StartNode] Node ${nodeId} (position ${globalNodeIndex}) -> Week Day ${dayPosition + 1}: ${selectedDay.day.day}`);
           } else {
             console.log(`[StartNode] No workout days in plan for node ${nodeId}, using fallback.`);
           }
        } else {
          console.log(`[StartNode] No weekly plan found for user, using fallback workout.`);
        }

        workout = await storage.createWorkout({
          userId,
          nodeId,
          source: "weekly-plan",
          scheduleIndex,
          workoutJson,
        });
      }

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

  app.post(api.game.completeNode.path, async (req: any, res) => {
    try {
      const { workoutId, metrics } = api.game.completeNode.input.parse(req.body);
      const userId = "test-user"; // Hardcoded for now

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
      const newCompletedNodes = Array.from(new Set([...profile.completedNodeIds, workout.nodeId]));
      
      // Find nodes that have this node as prerequisite
      const nextNodes = nodes.filter(n => n.prerequisites?.includes(workout.nodeId));
      nextNodes.forEach(n => {
        if (!newUnlockedNodes.includes(n.id)) {
          newUnlockedNodes.push(n.id);
        }
      });

      // Calculate streak properly (respects rest days from weekly plan)
      const newStreak = calculateStreak(profile.streak, profile.lastActiveDate, profile.weeklyPlan);

      const updatedProfile = await storage.updateUserProfile(userId, {
        xp: profile.xp + xpGain,
        coins: profile.coins + coinsGain,
        streak: newStreak,
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

  app.post(api.game.quickFit.path, async (req: any, res) => {
    try {
      const { duration, focus, intensity, mood } = api.game.quickFit.input.parse(req.body);
      const userId = "test-user"; // Hardcoded for now
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

  // === Notification Routes ===
  
  // Get VAPID public key for push subscription
  app.get("/api/notifications/vapid-public-key", (req, res) => {
    if (!VAPID_PUBLIC_KEY) {
      return res.status(500).json({ message: "Push notifications not configured" });
    }
    res.json({ publicKey: VAPID_PUBLIC_KEY });
  });

  // Subscribe to push notifications
  const subscriptionSchema = z.object({
    subscription: z.object({
      endpoint: z.string().url(),
      keys: z.object({
        p256dh: z.string(),
        auth: z.string()
      })
    })
  });

  app.post("/api/notifications/subscribe", async (req: any, res) => {
    try {
      const userId = "test-user"; // Hardcoded for now
      
      const parseResult = subscriptionSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid subscription format", errors: parseResult.error.errors });
      }

      const profile = await storage.getUserProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      await storage.updateUserProfile(userId, {
        pushSubscription: parseResult.data.subscription,
        notificationsEnabled: true
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to save push subscription:", error);
      res.status(500).json({ message: "Failed to save subscription" });
    }
  });

  // Unsubscribe from push notifications
  app.post("/api/notifications/unsubscribe", async (req: any, res) => {
    try {
      const userId = "test-user"; // Hardcoded for now

      const profile = await storage.getUserProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      await storage.updateUserProfile(userId, {
        pushSubscription: null,
        notificationsEnabled: false
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      res.status(500).json({ message: "Failed to unsubscribe" });
    }
  });

  // Update notification preferences
  const preferencesSchema = z.object({
    workoutReminderTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    streakReminderEnabled: z.boolean().optional(),
    notificationsEnabled: z.boolean().optional()
  });

  app.patch("/api/notifications/preferences", async (req: any, res) => {
    try {
      const userId = "test-user"; // Hardcoded for now
      
      const parseResult = preferencesSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid preferences format", errors: parseResult.error.errors });
      }

      const profile = await storage.getUserProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      const { workoutReminderTime, streakReminderEnabled, notificationsEnabled } = parseResult.data;

      const updates: any = {};
      if (typeof notificationsEnabled === 'boolean') updates.notificationsEnabled = notificationsEnabled;
      if (typeof streakReminderEnabled === 'boolean') updates.streakReminderEnabled = streakReminderEnabled;
      if (workoutReminderTime !== undefined) updates.workoutReminderTime = workoutReminderTime;

      await storage.updateUserProfile(userId, updates);
      const updatedProfile = await storage.getUserProfile(userId);

      res.json({ success: true, profile: updatedProfile });
    } catch (error) {
      console.error("Failed to update notification preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Test notification (for development)
  app.post("/api/notifications/test", async (req: any, res) => {
    try {
      const userId = "test-user"; // Hardcoded for now
      const profile = await storage.getUserProfile(userId);

      if (!profile?.pushSubscription || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        return res.status(400).json({ message: "Push notifications not set up" });
      }

      const payload = JSON.stringify({
        title: "Fitness Journey",
        body: "Time for your workout! Your streak is at " + profile.streak + " days.",
        type: "workout_reminder",
        url: "/"
      });

      await webpush.sendNotification(profile.pushSubscription as any, payload);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to send test notification:", error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });

  return httpServer;
}
