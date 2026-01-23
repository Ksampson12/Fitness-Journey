/**
 * Platform utilities for PWA and Capacitor compatibility
 * 
 * Provides feature detection and platform-specific helpers
 */

// Check if running as installed PWA
export function isInstalledPWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  // iOS standalone mode
  if ((navigator as any).standalone === true) return true;
  
  // Other platforms - check display-mode
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
  
  return false;
}

// Check if app is running in Capacitor native container
export function isCapacitor(): boolean {
  return typeof window !== 'undefined' && 
         'Capacitor' in window && 
         (window as any).Capacitor?.isNativePlatform?.() === true;
}

// Check if running on iOS
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Check if running on Android
export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}

// Check if mobile device
export function isMobile(): boolean {
  return isIOS() || isAndroid();
}

// Check if touch device
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Check if online
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

// Get platform name
export function getPlatformName(): 'ios' | 'android' | 'web' {
  if (isCapacitor()) {
    const platform = (window as any).Capacitor?.getPlatform?.();
    if (platform === 'ios') return 'ios';
    if (platform === 'android') return 'android';
  }
  if (isIOS()) return 'ios';
  if (isAndroid()) return 'android';
  return 'web';
}

// Check if notifications are supported
export function supportsNotifications(): boolean {
  return typeof window !== 'undefined' && 
         'Notification' in window && 
         'serviceWorker' in navigator;
}

// Check if push notifications are supported
export function supportsPushNotifications(): boolean {
  return supportsNotifications() && 
         'PushManager' in window;
}

// Vibrate device (if supported)
export function vibrate(pattern: number | number[] = 10): boolean {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return false;
  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}

// Share content (Web Share API)
export async function shareContent(data: ShareData): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) return false;
  try {
    await navigator.share(data);
    return true;
  } catch {
    return false;
  }
}

// Can share (check before showing share button)
export function canShare(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator;
}

// Lock screen orientation (if supported)
export async function lockOrientation(orientation: 'portrait' | 'landscape' = 'portrait'): Promise<boolean> {
  if (typeof screen === 'undefined' || !screen.orientation) return false;
  try {
    // @ts-ignore - lock() exists on modern browsers but TS doesn't have full types
    if (typeof screen.orientation.lock === 'function') {
      await (screen.orientation as any).lock(orientation);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Keep screen awake (Capacitor: use @capacitor-community/keep-awake)
export function supportsWakeLock(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

export async function requestWakeLock(): Promise<WakeLockSentinel | null> {
  if (!supportsWakeLock()) return null;
  try {
    return await (navigator as any).wakeLock.request('screen');
  } catch {
    return null;
  }
}

// Utility to prevent zoom on double-tap (for game-like UX)
export function preventDoubleTapZoom(element: HTMLElement): () => void {
  let lastTouchEnd = 0;
  
  const handler = (e: TouchEvent) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  };
  
  element.addEventListener('touchend', handler, { passive: false });
  
  return () => element.removeEventListener('touchend', handler);
}
