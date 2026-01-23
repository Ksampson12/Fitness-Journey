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
  displayName: text("display_name"), // User's preferred name
  fitnessLevel: text("fitness_level").default("beginner"), // beginner, intermediate, advanced
  equipment: text("equipment").array().default([]), // dumbbell, mat, etc
  goals: text("goals").array().default([]), // strength, cardio, flexibility
  activities: text("activities").array().default([]), // running, swimming, weightlifting, etc
  
  // Enhanced Profile Data
  ageRange: text("age_range"), // under-18, 18-24, 25-34, 35-44, 45-54, 55+
  trainingExperience: text("training_experience"), // never, some, 1-3-years, 3-plus-years
  primaryGoal: text("primary_goal"), // fat-loss, muscle-building, strength, endurance, mobility, general-health
  secondaryGoal: text("secondary_goal"), // posture, core-strength, athletic-performance, stress-reduction
  targetAreas: text("target_areas").array().default([]), // full-body, upper-body, lower-body, core, glutes, arms, back
  workoutDaysPerWeek: integer("workout_days_per_week"), // 1-2, 3, 4, 5-plus
  preferredWorkoutLength: text("preferred_workout_length"), // 15-20-min, 30-min, 45-min, 60-min
  bestTimeOfDay: text("best_time_of_day"), // morning, afternoon, evening, varies
  workoutLocation: text("workout_location"), // home, gym, both
  injuriesOrLimitations: text("injuries_or_limitations"), // no, or description
  movementsToAvoid: text("movements_to_avoid").array().default([]), // squats, lunges, overhead-pressing, running, jumping
  workoutStyle: text("workout_style"), // strength, hiit, circuits, cardio, yoga, mixed
  intensityPreference: text("intensity_preference"), // low-steady, moderate, push-hard
  
  weeklyPlan: jsonb("weekly_plan"), // Stores AI generated weekly schedule and motivation
  nodeScheduleMap: jsonb("node_schedule_map"), // Maps nodeId -> scheduleIndex for explicit workout assignment
  
  // Physical Stats
  age: integer("age"),
  height: integer("height"), // in cm
  weight: integer("weight"), // in kg

  // Notification Preferences
  notificationsEnabled: boolean("notifications_enabled").default(false),
  workoutReminderTime: text("workout_reminder_time"), // HH:MM format, e.g. "08:00"
  streakReminderEnabled: boolean("streak_reminder_enabled").default(true),
  pushSubscription: jsonb("push_subscription"), // Stores the push subscription object

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
  
  source: text("source").notNull(), // ai, template, weekly-plan
  scheduleIndex: integer("schedule_index"), // Which day index from weekly plan (0-indexed)
  workoutJson: jsonb("workout_json").notNull(), // The actual AI generated workout structure
  
  completedAt: timestamp("completed_at"),
  completionMetrics: jsonb("completion_metrics"), // { calories: 300, duration: 1800 }
  
  createdAt: timestamp("created_at").defaultNow(),
});

// === EMAIL AUTHENTICATION TABLES ===

// Email identities - links emails to user profiles
export const emailIdentities = pgTable("email_identities", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  userId: varchar("user_id").notNull().unique(), // Links to user profile
  emailVerified: boolean("email_verified").default(false).notNull(),
  lastVerifiedAt: timestamp("last_verified_at"), // For 30-day re-verification
  createdAt: timestamp("created_at").defaultNow(),
});

// Magic link tokens for passwordless login
export const magicLinkTokens = pgTable("magic_link_tokens", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// OTP codes for 30-day re-verification
export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
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
}).extend({
  // Enhanced validation for onboarding
  displayName: z.string().min(1, "Name is required").max(50, "Name too long"),
  fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]),
  primaryGoal: z.enum(["fat-loss", "muscle-building", "strength", "endurance", "mobility", "general-health"]).optional(),
  secondaryGoal: z.enum(["posture", "core-strength", "athletic-performance", "stress-reduction"]).optional(),
  ageRange: z.enum(["under-18", "18-24", "25-34", "35-44", "45-54", "55+"]).optional(),
  trainingExperience: z.enum(["never", "some", "1-3-years", "3-plus-years"]).optional(),
  targetAreas: z.array(z.enum(["full-body", "upper-body", "lower-body", "core", "glutes", "arms", "back"])).default([]),
  workoutDaysPerWeek: z.number().min(1).max(7).optional(),
  preferredWorkoutLength: z.enum(["15-20-min", "30-min", "45-min", "60-min"]).optional(),
  bestTimeOfDay: z.enum(["morning", "afternoon", "evening", "varies"]).optional(),
  workoutLocation: z.enum(["home", "gym", "both"]).optional(),
  injuriesOrLimitations: z.string().optional(),
  movementsToAvoid: z.array(z.enum(["squats", "lunges", "overhead-pressing", "running", "jumping"])).default([]),
  workoutStyle: z.enum(["strength", "hiit", "circuits", "cardio", "yoga", "mixed"]).optional(),
  intensityPreference: z.enum(["low-steady", "moderate", "push-hard"]).optional(),
  equipment: z.array(z.enum(["bodyweight", "dumbbells", "barbell", "resistance-bands", "kettlebells", "machines", "cardio-equipment"])).default([]),
  goals: z.array(z.string()).default([]),
  activities: z.array(z.string()).default([]),
});

export const insertWorkoutSchema = createInsertSchema(workouts).omit({ 
  id: true, 
  createdAt: true,
  completedAt: true,
  completionMetrics: true
});

export const insertEmailIdentitySchema = createInsertSchema(emailIdentities).omit({
  id: true,
  createdAt: true,
});

export const insertMagicLinkTokenSchema = createInsertSchema(magicLinkTokens).omit({
  id: true,
  createdAt: true,
  usedAt: true,
});

export const insertOtpCodeSchema = createInsertSchema(otpCodes).omit({
  id: true,
  createdAt: true,
  usedAt: true,
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

// Email Auth
export type EmailIdentity = typeof emailIdentities.$inferSelect;
export type InsertEmailIdentity = z.infer<typeof insertEmailIdentitySchema>;
export type MagicLinkToken = typeof magicLinkTokens.$inferSelect;
export type InsertMagicLinkToken = z.infer<typeof insertMagicLinkTokenSchema>;
export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertOtpCode = z.infer<typeof insertOtpCodeSchema>;

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
