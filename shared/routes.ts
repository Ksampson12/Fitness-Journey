import { z } from 'zod';
import { insertUserProfileSchema, nodes, zones } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  user: {
    getProfile: {
      method: 'GET' as const,
      path: '/api/user/profile',
      responses: {
        200: z.any(), // Returns UserProfile
        404: errorSchemas.notFound,
      },
    },
    updateOnboarding: {
      method: 'POST' as const,
      path: '/api/user/onboarding',
      input: z.object({
        fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
        goals: z.array(z.string()),
        equipment: z.array(z.string()),
        avatarArchetype: z.string(),
        age: z.coerce.number().optional(),
        height: z.coerce.number().optional(),
        weight: z.coerce.number().optional(),
      }),
      responses: {
        200: z.any(), // Returns updated UserProfile
      },
    },
    updateProfile: {
      method: 'PATCH' as const,
      path: '/api/user/profile',
      input: z.object({
        fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        goals: z.array(z.string()).optional(),
        equipment: z.array(z.string()).optional(),
        avatarArchetype: z.string().optional(),
        age: z.coerce.number().optional(),
        height: z.coerce.number().optional(),
        weight: z.coerce.number().optional(),
      }),
      responses: {
        200: z.any(), // Returns updated UserProfile
      },
    },
  },
  map: {
    get: {
      method: 'GET' as const,
      path: '/api/map',
      responses: {
        200: z.object({
          nodes: z.array(z.any()), // GameNode[]
          zones: z.array(z.any()), // GameZone[]
        }),
      },
    },
  },
  game: {
    startNode: {
      method: 'POST' as const,
      path: '/api/game/start-node',
      input: z.object({
        nodeId: z.string(),
      }),
      responses: {
        200: z.object({
          workoutId: z.number(),
          workout: z.any(), // The JSON workout plan
          node: z.any(),
        }),
        400: errorSchemas.validation,
        403: errorSchemas.unauthorized, // Rate limited or locked
      },
    },
    completeNode: {
      method: 'POST' as const,
      path: '/api/game/complete-node',
      input: z.object({
        workoutId: z.number(),
        metrics: z.object({
          durationSeconds: z.number(),
          calories: z.number().optional(),
          difficultyRating: z.number().optional(),
        }),
      }),
      responses: {
        200: z.object({
          success: z.boolean(),
          rewards: z.object({
            xp: z.number(),
            coins: z.number(),
            unlockedNodes: z.array(z.string()),
            evolutionTriggered: z.boolean(),
          }),
          newProfileState: z.any(),
        }),
      },
    },
    quickFit: {
      method: 'POST' as const,
      path: '/api/game/quick-fit',
      input: z.object({
        duration: z.enum(['30', '60']), // minutes
        focus: z.string(), // e.g. "Full Body"
        intensity: z.string(), // e.g. "High"
        mood: z.string().optional(),
      }),
      responses: {
        200: z.object({
          workoutId: z.number(),
          workout: z.any(),
        }),
        403: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
