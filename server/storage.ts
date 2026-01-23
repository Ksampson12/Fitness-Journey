import { db } from "./db";
import { 
  userProfiles, nodes, zones, workouts, aiUsage,
  emailIdentities, magicLinkTokens, otpCodes,
  type UserProfile, type InsertUserProfile, 
  type GameNode, type GameZone, type Workout, type InsertWorkout,
  type EmailIdentity, type InsertEmailIdentity,
  type MagicLinkToken, type InsertMagicLinkToken,
  type OtpCode, type InsertOtpCode
} from "@shared/schema";
import { eq, and, isNull, gt, lt, sql } from "drizzle-orm";

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
  deleteActiveWorkout(userId: string, nodeId: string): Promise<void>;
  deleteAllActiveWorkouts(userId: string): Promise<void>;
  
  // AI Usage
  insertAiUsage(usage: any): Promise<void>;
  getAiUsageStats(): Promise<any>;
  getAiUsageByUser(): Promise<any>;
  
  // Email Auth
  getEmailIdentityByEmail(email: string): Promise<EmailIdentity | undefined>;
  getEmailIdentityByUserId(userId: string): Promise<EmailIdentity | undefined>;
  createEmailIdentity(identity: InsertEmailIdentity): Promise<EmailIdentity>;
  updateEmailIdentity(email: string, updates: Partial<EmailIdentity>): Promise<EmailIdentity>;
  
  createMagicLinkToken(token: InsertMagicLinkToken): Promise<MagicLinkToken>;
  getMagicLinkToken(token: string): Promise<MagicLinkToken | undefined>;
  markMagicLinkUsed(token: string): Promise<void>;
  
  createOtpCode(otp: InsertOtpCode): Promise<OtpCode>;
  getValidOtpCode(userId: string, code: string): Promise<OtpCode | undefined>;
  markOtpUsed(id: number): Promise<void>;
  
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

  async deleteActiveWorkout(userId: string, nodeId: string): Promise<void> {
    await db.delete(workouts)
      .where(and(
        eq(workouts.userId, userId),
        eq(workouts.nodeId, nodeId),
        isNull(workouts.completedAt)
      ));
  }

  async deleteAllActiveWorkouts(userId: string): Promise<void> {
    await db.delete(workouts)
      .where(and(
        eq(workouts.userId, userId),
        isNull(workouts.completedAt)
      ));
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

  // Email Auth implementations
  async getEmailIdentityByEmail(email: string): Promise<EmailIdentity | undefined> {
    const [identity] = await db.select().from(emailIdentities).where(eq(emailIdentities.email, email.toLowerCase()));
    return identity;
  }

  async getEmailIdentityByUserId(userId: string): Promise<EmailIdentity | undefined> {
    const [identity] = await db.select().from(emailIdentities).where(eq(emailIdentities.userId, userId));
    return identity;
  }

  async createEmailIdentity(identity: InsertEmailIdentity): Promise<EmailIdentity> {
    const [newIdentity] = await db.insert(emailIdentities).values({
      ...identity,
      email: identity.email.toLowerCase(),
    }).returning();
    return newIdentity;
  }

  async updateEmailIdentity(email: string, updates: Partial<EmailIdentity>): Promise<EmailIdentity> {
    const [updated] = await db.update(emailIdentities)
      .set(updates)
      .where(eq(emailIdentities.email, email.toLowerCase()))
      .returning();
    return updated;
  }

  async createMagicLinkToken(token: InsertMagicLinkToken): Promise<MagicLinkToken> {
    const [newToken] = await db.insert(magicLinkTokens).values({
      ...token,
      email: token.email.toLowerCase(),
    }).returning();
    return newToken;
  }

  async getMagicLinkToken(token: string): Promise<MagicLinkToken | undefined> {
    const [result] = await db.select().from(magicLinkTokens)
      .where(and(
        eq(magicLinkTokens.token, token),
        isNull(magicLinkTokens.usedAt),
        gt(magicLinkTokens.expiresAt, new Date())
      ));
    return result;
  }

  async markMagicLinkUsed(token: string): Promise<void> {
    await db.update(magicLinkTokens)
      .set({ usedAt: new Date() })
      .where(eq(magicLinkTokens.token, token));
  }

  async createOtpCode(otp: InsertOtpCode): Promise<OtpCode> {
    const [newOtp] = await db.insert(otpCodes).values(otp).returning();
    return newOtp;
  }

  async getValidOtpCode(userId: string, code: string): Promise<OtpCode | undefined> {
    const [result] = await db.select().from(otpCodes)
      .where(and(
        eq(otpCodes.userId, userId),
        eq(otpCodes.code, code),
        isNull(otpCodes.usedAt),
        gt(otpCodes.expiresAt, new Date())
      ));
    return result;
  }

  async markOtpUsed(id: number): Promise<void> {
    await db.update(otpCodes)
      .set({ usedAt: new Date() })
      .where(eq(otpCodes.id, id));
  }

  // AI Usage Methods
  async insertAiUsage(usage: any): Promise<void> {
    await db.insert(aiUsage).values(usage);
  }

  async getAiUsageStats(): Promise<any> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get total stats
    const totalStats = await db.select({
      totalRequests: sql<number>`count(*)`,
      totalCost: sql<number>`sum(cost)`,
    }).from(aiUsage).where(eq(aiUsage.success, true));

    // Get today's stats
    const todayStats = await db.select({
      requestsToday: sql<number>`count(*)`,
      costToday: sql<number>`sum(cost)`,
    }).from(aiUsage).where(and(
      eq(aiUsage.success, true),
      gt(aiUsage.createdAt, today)
    ));

    // Get top users
    const topUsers = await db.select({
      userId: aiUsage.userId,
      displayName: userProfiles.displayName,
      requests: sql<number>`count(*)`,
      cost: sql<number>`sum(cost)`,
    })
    .from(aiUsage)
    .innerJoin(userProfiles, eq(aiUsage.userId, userProfiles.userId))
    .where(eq(aiUsage.success, true))
    .groupBy(aiUsage.userId, userProfiles.displayName)
    .orderBy(sql`count(*) desc`)
    .limit(5);

    return {
      totalRequests: totalStats[0]?.totalRequests || 0,
      totalCost: (totalStats[0]?.totalCost || 0) / 100, // Convert cents to dollars
      requestsToday: todayStats[0]?.requestsToday || 0,
      costToday: (todayStats[0]?.costToday || 0) / 100, // Convert cents to dollars
      topUsers: topUsers.map(u => ({
        ...u,
        cost: u.cost / 100 // Convert cents to dollars
      }))
    };
  }

  async getAiUsageByUser(): Promise<any> {
    // Get AI usage per user for admin dashboard
    const userStats = await db.select({
      userId: userProfiles.userId,
      displayName: userProfiles.displayName,
      aiRequests: sql<number>`count(*)`,
      lastAiRequest: sql<Date>`max(${aiUsage.createdAt})`,
    })
    .from(userProfiles)
    .leftJoin(aiUsage, eq(userProfiles.userId, aiUsage.userId))
    .groupBy(userProfiles.userId, userProfiles.displayName);

    return userStats;
  }
}

export const storage = new DatabaseStorage();
