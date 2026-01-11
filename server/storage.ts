import { db } from "./db";
import { 
  userProfiles, nodes, zones, workouts,
  type UserProfile, type InsertUserProfile, 
  type GameNode, type GameZone, type Workout, type InsertWorkout 
} from "@shared/schema";
import { eq, and, isNull, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // User Profile
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile>;
  
  // Map Data
  getMapNodes(): Promise<GameNode[]>;
  getMapZones(): Promise<GameZone[]>;
  
  // Workouts
  getWorkout(id: number): Promise<Workout | undefined>;
  findActiveWorkout(userId: string, nodeId: string): Promise<Workout | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  completeWorkout(id: number, metrics: any): Promise<Workout>;
  
  // Seed Helpers
  seedMapData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [newProfile] = await db.insert(userProfiles).values(profile).returning();
    return newProfile;
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const [updated] = await db.update(userProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updated;
  }

  async getMapNodes(): Promise<GameNode[]> {
    return await db.select().from(nodes);
  }

  async getMapZones(): Promise<GameZone[]> {
    return await db.select().from(zones);
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    const [workout] = await db.select().from(workouts).where(eq(workouts.id, id));
    return workout;
  }

  async findActiveWorkout(userId: string, nodeId: string): Promise<Workout | undefined> {
    // Find a workout for this node that hasn't been completed yet
    const [workout] = await db.select().from(workouts)
      .where(and(
        eq(workouts.userId, userId),
        eq(workouts.nodeId, nodeId),
        isNull(workouts.completedAt)
      ));
    return workout;
  }

  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const [newWorkout] = await db.insert(workouts).values(workout).returning();
    return newWorkout;
  }

  async completeWorkout(id: number, metrics: any): Promise<Workout> {
    const [completed] = await db.update(workouts)
      .set({ 
        completedAt: new Date(), 
        completionMetrics: metrics 
      })
      .where(eq(workouts.id, id))
      .returning();
    return completed;
  }

  async seedMapData(): Promise<void> {
    // Upsert Zones to ensure theme is updated
    await db.insert(zones).values([
      { id: "zone1", name: "Sun-Kissed Shore", theme: "beach", orderIndex: 1 },
      { id: "zone2", name: "Coral Reef Depths", theme: "underwater", orderIndex: 2 },
    ]).onConflictDoUpdate({
      target: zones.id,
      set: { name: sql`excluded.name`, theme: sql`excluded.theme` }
    });

    // Upsert Nodes to ensure new names/types are applied
    await db.insert(nodes).values([
      // Zone 1
      { 
        id: "z1-n1", zoneId: "zone1", name: "Morning Surf", type: "workout", 
        difficulty: 1, orderIndex: 1, x: 50, y: 80, 
        aiTags: ["full-body", "cardio"],
        prerequisites: []
      },
      { 
        id: "z1-n2", zoneId: "zone1", name: "Sandy Sprint", type: "workout", 
        difficulty: 2, orderIndex: 2, x: 150, y: 120, 
        aiTags: ["legs", "cardio"],
        prerequisites: ["z1-n1"]
      },
      { 
        id: "z1-n3", zoneId: "zone1", name: "Shark Encounter", type: "boss", 
        difficulty: 3, orderIndex: 3, x: 250, y: 100, 
        aiTags: ["strength", "core"],
        prerequisites: ["z1-n2"]
      },
      // Zone 2
      { 
        id: "z2-n1", zoneId: "zone2", name: "Deep Dive", type: "workout", 
        difficulty: 4, orderIndex: 4, x: 350, y: 150, 
        aiTags: ["breath-work", "endurance"],
        prerequisites: ["z1-n3"]
      }
    ]).onConflictDoUpdate({
      target: nodes.id,
      set: { 
        name: sql`excluded.name`, 
        type: sql`excluded.type`,
        aiTags: sql`excluded.ai_tags`
      }
    });
  }
}

export const storage = new DatabaseStorage();
