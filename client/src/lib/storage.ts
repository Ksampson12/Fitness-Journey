/**
 * Storage abstraction layer for Capacitor compatibility
 * 
 * This module provides a unified storage API that works in both:
 * - Web browsers (using localStorage)
 * - Capacitor native apps (can be swapped to @capacitor/preferences)
 * 
 * When migrating to Capacitor, replace the implementation with:
 * import { Preferences } from '@capacitor/preferences';
 */

export interface StorageDriver {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

// Web/Browser storage driver using localStorage
class LocalStorageDriver implements StorageDriver {
  async get(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('localStorage not available:', e);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
  }

  async keys(): Promise<string[]> {
    try {
      return Object.keys(localStorage);
    } catch (e) {
      console.warn('localStorage not available:', e);
      return [];
    }
  }
}

// Memory storage fallback for SSR or when localStorage is unavailable
class MemoryStorageDriver implements StorageDriver {
  private store: Map<string, string> = new Map();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.store.keys());
  }
}

// Detect if localStorage is available
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

// Detect if running in Capacitor
export function isCapacitor(): boolean {
  return typeof window !== 'undefined' && 
         'Capacitor' in window && 
         (window as any).Capacitor?.isNativePlatform?.() === true;
}

// Detect platform
export function getPlatform(): 'ios' | 'android' | 'web' {
  if (!isCapacitor()) return 'web';
  const platform = (window as any).Capacitor?.getPlatform?.();
  if (platform === 'ios') return 'ios';
  if (platform === 'android') return 'android';
  return 'web';
}

// Create the appropriate storage driver
function createStorageDriver(): StorageDriver {
  // When running in Capacitor, you would swap this to:
  // return new CapacitorPreferencesDriver();
  
  if (typeof window === 'undefined') {
    return new MemoryStorageDriver();
  }
  
  if (isLocalStorageAvailable()) {
    return new LocalStorageDriver();
  }
  
  return new MemoryStorageDriver();
}

// Singleton storage instance
const storageDriver = createStorageDriver();

// High-level storage API with JSON support
export const storage = {
  async get<T = string>(key: string): Promise<T | null> {
    const value = await storageDriver.get(key);
    if (value === null) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await storageDriver.set(key, stringValue);
  },

  async remove(key: string): Promise<void> {
    await storageDriver.remove(key);
  },

  async clear(): Promise<void> {
    await storageDriver.clear();
  },

  async keys(): Promise<string[]> {
    return storageDriver.keys();
  },

  // Convenience method for getting raw string (no JSON parse)
  async getString(key: string): Promise<string | null> {
    return storageDriver.get(key);
  },

  // Convenience method for setting raw string (no JSON stringify)
  async setString(key: string, value: string): Promise<void> {
    return storageDriver.set(key, value);
  }
};

// Export type for external use
export type Storage = typeof storage;
