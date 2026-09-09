/**
 * HomeOps AI — User Profile Store
 * Manages user household profile and onboarding status
 */
import { UserProfile } from '../types';
import { idbGet, idbSet, idbDelete, localStore, STORES, STORAGE_KEYS } from './storage';

export function validateProfileInput(name: string): { valid: boolean; error?: string; cleanName: string } {
  const cleanName = (name || '').trim();
  if (!cleanName) {
    return { valid: false, error: 'User name is required', cleanName: '' };
  }
  if (cleanName.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters long', cleanName };
  }
  if (cleanName.length > 50) {
    return { valid: false, error: 'Name must not exceed 50 characters', cleanName };
  }
  return { valid: true, cleanName };
}

export async function getProfile(): Promise<UserProfile | null> {
  // First check localStorage for fast synchronous hydration
  const localProf = localStore.get<UserProfile>(STORAGE_KEYS.USER_PROFILE);
  if (localProf && localProf.name) {
    return localProf;
  }

  // Fallback to IndexedDB
  const idbProf = await idbGet<UserProfile>(STORES.PROFILE, 'user_profile');
  if (idbProf && idbProf.name) {
    // Keep localStorage in sync for instant subsequent reads
    localStore.set(STORAGE_KEYS.USER_PROFILE, idbProf);
    return idbProf;
  }

  return null;
}

export async function saveProfile(data: {
  name: string;
  householdName?: string;
  city?: string;
  currency?: string;
  notificationPref?: 'dashboard' | 'telegram' | 'both';
  members?: { id: string; name: string; role: string }[];
}): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  const validation = validateProfileInput(data.name);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const existing = (await getProfile()) || ({} as Partial<UserProfile>);
  const now = new Date().toISOString();

  const profile: UserProfile = {
    id: existing.id || `profile-${Date.now()}`,
    name: validation.cleanName,
    householdName: (data.householdName || '').trim() || `${validation.cleanName}'s Home`,
    city: (data.city || '').trim() || undefined,
    currency: data.currency || existing.currency || 'INR (₹)',
    notificationPref: data.notificationPref || existing.notificationPref || 'dashboard',
    members: data.members || existing.members || [],
    createdAt: existing.createdAt || now,
    updatedAt: now,
  };

  // Persist to both localStorage and IndexedDB
  localStore.set(STORAGE_KEYS.USER_PROFILE, profile);
  await idbSet(STORES.PROFILE, 'user_profile', profile);

  return { success: true, profile };
}

export function hasCompletedOnboarding(): boolean {
  const flag = localStore.get<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETED);
  return flag === true;
}

export function setOnboardingCompleted(completed: boolean): void {
  localStore.set(STORAGE_KEYS.ONBOARDING_COMPLETED, completed);
}

export async function clearProfile(): Promise<void> {
  localStore.remove(STORAGE_KEYS.USER_PROFILE);
  localStore.remove(STORAGE_KEYS.ONBOARDING_COMPLETED);
  await idbDelete(STORES.PROFILE, 'user_profile');
}
