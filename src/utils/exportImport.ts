/**
 * HomeOps AI — Export & Import Utility
 * Enables full backup and restore of local household data without an external database.
 */
import { StoredHouseholdData, UserProfile } from '../types';
import { getProfile, saveProfile } from './profileStore';
import { loadHouseholdState, saveHouseholdState } from './statePersistence';
import { loadConversation, saveConversation } from './conversationStore';
import { localStore, STORAGE_KEYS } from './storage';

export async function generateBackupData(): Promise<StoredHouseholdData> {
  const profile = (await getProfile()) || {
    id: `profile-${Date.now()}`,
    name: 'Homeowner',
    householdName: 'My Home',
    currency: 'INR (₹)',
    notificationPref: 'dashboard',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const householdState = await loadHouseholdState();
  const conversations = await loadConversation();
  const preferences = localStore.get<any>(STORAGE_KEYS.PREFERENCES) || {
    theme: 'light',
    currency: profile.currency || 'INR (₹)',
    autoReplenish: true,
    onboardingCompleted: true,
  };

  const backup: StoredHouseholdData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    profile,
    preferences,
    tasks: householdState?.tasks || [],
    inventory: householdState?.inventory || [],
    shopping: householdState?.shopping || [],
    bills: householdState?.bills || [],
    maintenance: householdState?.maintenance || [],
    activities: householdState?.activities || [],
    conversations: conversations || [],
  };

  return backup;
}

export function downloadBackupFile(backup: StoredHouseholdData, filename = 'homeops-backup.json'): void {
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateBackupData(data: any): { valid: boolean; error?: string; parsed?: StoredHouseholdData } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid backup file: Not a valid JSON object' };
  }

  if (!data.profile || typeof data.profile !== 'object') {
    return { valid: false, error: 'Invalid backup file: Missing household profile' };
  }

  if (!data.profile.name || typeof data.profile.name !== 'string' || !data.profile.name.trim()) {
    return { valid: false, error: 'Invalid backup file: Profile has missing or empty user name' };
  }

  if (data.tasks !== undefined && !Array.isArray(data.tasks)) {
    return { valid: false, error: 'Invalid backup file: Tasks must be an array' };
  }

  if (data.inventory !== undefined && !Array.isArray(data.inventory)) {
    return { valid: false, error: 'Invalid backup file: Inventory must be an array' };
  }

  if (data.shopping !== undefined && !Array.isArray(data.shopping)) {
    return { valid: false, error: 'Invalid backup file: Shopping items must be an array' };
  }

  if (data.bills !== undefined && !Array.isArray(data.bills)) {
    return { valid: false, error: 'Invalid backup file: Bills must be an array' };
  }

  const validData: StoredHouseholdData = {
    version: data.version || '1.0',
    exportedAt: data.exportedAt || new Date().toISOString(),
    profile: {
      id: data.profile.id || `profile-${Date.now()}`,
      name: data.profile.name.trim(),
      householdName: (data.profile.householdName || '').trim() || `${data.profile.name.trim()}'s Home`,
      city: data.profile.city || undefined,
      currency: data.profile.currency || 'INR (₹)',
      notificationPref: data.profile.notificationPref || 'dashboard',
      members: Array.isArray(data.profile.members) ? data.profile.members : [],
      createdAt: data.profile.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    preferences: data.preferences,
    tasks: Array.isArray(data.tasks) ? data.tasks : [],
    inventory: Array.isArray(data.inventory) ? data.inventory : [],
    shopping: Array.isArray(data.shopping) ? data.shopping : [],
    bills: Array.isArray(data.bills) ? data.bills : [],
    maintenance: Array.isArray(data.maintenance) ? data.maintenance : [],
    activities: Array.isArray(data.activities) ? data.activities : [],
    conversations: Array.isArray(data.conversations) ? data.conversations : [],
  };

  return { valid: true, parsed: validData };
}

export async function importBackupData(jsonString: string): Promise<{ success: boolean; error?: string; data?: StoredHouseholdData }> {
  try {
    const raw = JSON.parse(jsonString);
    const validation = validateBackupData(raw);
    if (!validation.valid || !validation.parsed) {
      return { success: false, error: validation.error || 'Validation failed' };
    }

    const { profile, tasks, inventory, shopping, bills, maintenance, activities, conversations } = validation.parsed;

    // Save profile and mark onboarding as complete
    await saveProfile(profile);
    localStore.set(STORAGE_KEYS.ONBOARDING_COMPLETED, true);

    // Save household state to IndexedDB
    await saveHouseholdState({
      tasks,
      inventory,
      shopping,
      bills,
      maintenance,
      activities,
    });

    // Save conversations if present
    if (conversations && conversations.length > 0) {
      await saveConversation(conversations);
    }

    return { success: true, data: validation.parsed };
  } catch (err: any) {
    return { success: false, error: `JSON Parse error: ${err.message || 'Invalid file format'}` };
  }
}
