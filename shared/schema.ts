import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users as authUsers } from "./models/auth";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

// Extend the auth users table with gamification fields using a separate profile table
// or just assume we query 'users' from auth and join with this profile table.
// For simplicity in this stack, we'll create a 'user_profiles' table linked to auth.users.id
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(), // Links to auth.users.id
  
  // Progression
  xp: integer("xp").default(0).notNull(),
  coins: integer("coins").default(0).notNull(),
  streak: integer("streak").default(0).notNull(),
  lastActiveDate: timestamp("last_active_date"),
  
  // Journey State
  currentNodeId: text("current_node_id").notNull(),
  unlockedNodeIds: text("unlocked_node_ids").array().notNull().default([]),
  completedNodeIds: text("completed_node_ids").array().notNull().default([]),
  
  // Avatar State
  avatarArchetype: text("avatar_archetype").default("rookie").notNull(), // rookie, runner, lifter, yogi
  evolutionStage: integer("evolution_stage").default(1).notNull(),
  equippedItems: text("equipped_items").array().default([]),
  
  // Settings / AI Context
  fitnessLevel: text("fitness_level").default("beginner"), // beginner, intermediate, advanced
  equipment: text("equipment").array().default([]), // dumbbell, mat, etc
  goals: text("goals").array().default([]), // strength, cardio, flexibility
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const nodes = pgTable("nodes", {
  id: text("id").primaryKey(), // Using string IDs for map nodes (e.g., "zone1-node1")
  zoneId: text("zone_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // workout, recovery, boss, checkpoint
  difficulty: integer("difficulty").default(1).notNull(),
  prerequisites: text("prerequisites").array().default([]),
  orderIndex: integer("order_index").notNull(),
  
  // AI Generation context
  aiTags: text("ai_tags").array().default([]), // ["hiit", "upper-body"]
  
  // Visuals
  x: integer("x").notNull(), // Map coordinates
  y: integer("y").notNull(),
});

export const zones = pgTable("zones", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  theme: text("theme").notNull(), // forest, volcano, cyber_city
  orderIndex: integer("order_index").notNull(),
});

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(), // Links to auth.users.id
  nodeId: text("node_id").notNull(), // Which node this workout is for
  
  source: text("source").notNull(), // ai, template
  workoutJson: jsonb("workout_json").notNull(), // The actual AI generated workout structure
  
  completedAt: timestamp("completed_at"),
  completionMetrics: jsonb("completion_metrics"), // { calories: 300, duration: 1800 }
  
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const userProfilesRelations = relations(userProfiles, ({ many }) => ({
  // One user can have many workouts (via userId, though typical ORM relation requires FK)
}));

// === BASE SCHEMAS ===
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertWorkoutSchema = createInsertSchema(workouts).omit({ 
  id: true, 
  createdAt: true,
  completedAt: true,
  completionMetrics: true
});

// === EXPLICIT API CONTRACT TYPES ===

// User State
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

// Nodes & Map
export type GameNode = typeof nodes.$inferSelect;
export type GameZone = typeof zones.$inferSelect;

// Workouts
export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;

// API Requests/Responses
export type StartNodeRequest = {
  nodeId: string;
};

export type StartNodeResponse = {
  workoutId: number;
  workout: any; // The JSON content
  node: GameNode;
};

export type CompleteNodeRequest = {
  workoutId: number;
  metrics: {
    durationSeconds: number;
    calories?: number;
    difficultyRating?: number;
  };
};

export type CompleteNodeResponse = {
  success: boolean;
  rewards: {
    xp: number;
    coins: number;
    unlockedNodes: string[];
    evolutionTriggered: boolean;
  };
  newProfileState: UserProfile;
};

export type OnboardingRequest = {
  fitnessLevel: string;
  goals: string[];
  equipment: string[];
  avatarArchetype: string;
};

export * from "./models/auth";
export * from "./models/chat";
