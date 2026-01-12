import { db } from "./db";
import { 
  userProfiles, nodes, zones, workouts,
  type UserProfile, type InsertUserProfile, 
  type GameNode, type GameZone, type Workout, type InsertWorkout 
} from "@shared/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";

export interface IStorage {
  // User Profile
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile>;
  deleteUserProfile(userId: string): Promise<void>;
  
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

  async deleteUserProfile(userId: string): Promise<void> {
    await db.delete(userProfiles).where(eq(userProfiles.userId, userId));
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
    const existingZones = await this.getMapZones();
    if (existingZones.length > 0) return;

    // Create Zones
    await db.insert(zones).values([
      { id: "zone1", name: "The Awakening Forest", theme: "forest", orderIndex: 1 },
      { id: "zone2", name: "Iron Canyon", theme: "canyon", orderIndex: 2 },
    ]);

    // Create Nodes - 7 per zone (one for each day of the weekly plan)
    // Day 1: Full-Body Strength, Day 2: Light Cardio + Core, Day 3: Upper-Body Strength
    // Day 4: Active Recovery, Day 5: Lower-Body Strength, Day 6: Cardio + Core, Day 7: Rest
    await db.insert(nodes).values([
      // Zone 1 - The Awakening Forest (Week 1)
      { 
        id: "z1-n1", zoneId: "zone1", name: "Ancient Oak Awakening", type: "workout", 
        difficulty: 1, orderIndex: 1, x: 50, y: 120, 
        aiTags: ["full-body", "strength"],
        prerequisites: []
      },
      { 
        id: "z1-n2", zoneId: "zone1", name: "Stream Stride", type: "workout", 
        difficulty: 1, orderIndex: 2, x: 120, y: 80, 
        aiTags: ["cardio", "core", "mobility"],
        prerequisites: ["z1-n1"]
      },
      { 
        id: "z1-n3", zoneId: "zone1", name: "Canopy Climb", type: "workout", 
        difficulty: 2, orderIndex: 3, x: 200, y: 110, 
        aiTags: ["upper-body", "strength"],
        prerequisites: ["z1-n2"]
      },
      { 
        id: "z1-n4", zoneId: "zone1", name: "Moss Meadow Rest", type: "recovery", 
        difficulty: 1, orderIndex: 4, x: 280, y: 70, 
        aiTags: ["recovery", "cardio"],
        prerequisites: ["z1-n3"]
      },
      { 
        id: "z1-n5", zoneId: "zone1", name: "Root Strength", type: "workout", 
        difficulty: 2, orderIndex: 5, x: 350, y: 100, 
        aiTags: ["lower-body", "strength"],
        prerequisites: ["z1-n4"]
      },
      { 
        id: "z1-n6", zoneId: "zone1", name: "Forest Trail Run", type: "workout", 
        difficulty: 2, orderIndex: 6, x: 420, y: 60, 
        aiTags: ["cardio", "core"],
        prerequisites: ["z1-n5"]
      },
      { 
        id: "z1-n7", zoneId: "zone1", name: "Sunlit Glade", type: "recovery", 
        difficulty: 1, orderIndex: 7, x: 490, y: 90, 
        aiTags: ["rest", "recovery"],
        prerequisites: ["z1-n6"]
      },
      // Zone 2 - Iron Canyon (Week 2)
      { 
        id: "z2-n1", zoneId: "zone2", name: "Iron Ridge Dawn", type: "workout", 
        difficulty: 2, orderIndex: 8, x: 50, y: 120, 
        aiTags: ["full-body", "strength"],
        prerequisites: ["z1-n7"]
      },
      { 
        id: "z2-n2", zoneId: "zone2", name: "Canyon Breeze", type: "workout", 
        difficulty: 2, orderIndex: 9, x: 120, y: 80, 
        aiTags: ["cardio", "core", "mobility"],
        prerequisites: ["z2-n1"]
      },
      { 
        id: "z2-n3", zoneId: "zone2", name: "Cliff Face Challenge", type: "workout", 
        difficulty: 3, orderIndex: 10, x: 200, y: 110, 
        aiTags: ["upper-body", "strength"],
        prerequisites: ["z2-n2"]
      },
      { 
        id: "z2-n4", zoneId: "zone2", name: "Echo Cave", type: "recovery", 
        difficulty: 2, orderIndex: 11, x: 280, y: 70, 
        aiTags: ["recovery", "cardio"],
        prerequisites: ["z2-n3"]
      },
      { 
        id: "z2-n5", zoneId: "zone2", name: "Boulder Squat", type: "workout", 
        difficulty: 3, orderIndex: 12, x: 350, y: 100, 
        aiTags: ["lower-body", "strength"],
        prerequisites: ["z2-n4"]
      },
      { 
        id: "z2-n6", zoneId: "zone2", name: "Ravine Rush", type: "workout", 
        difficulty: 3, orderIndex: 13, x: 420, y: 60, 
        aiTags: ["cardio", "core"],
        prerequisites: ["z2-n5"]
      },
      { 
        id: "z2-n7", zoneId: "zone2", name: "Summit Sunrise", type: "recovery", 
        difficulty: 2, orderIndex: 14, x: 490, y: 90, 
        aiTags: ["rest", "recovery"],
        prerequisites: ["z2-n6"]
      }
    ]);
  }
}

export const storage = new DatabaseStorage();
