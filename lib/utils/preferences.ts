/**
 * User Preferences Management
 * Syncs preferences between localStorage (instant) and database (persistent across devices)
 */

import { createClient } from '@/lib/supabase/client'

export interface UserPreferences {
  // View filters
  show_shifts: boolean
  show_time_off: boolean
  show_financial_records: boolean
  show_income_records: boolean
  show_expense_records: boolean

  // Card display preferences
  show_shift_income_card: boolean
  show_fixed_income_card: boolean
  show_other_income_card: boolean
  show_expense_card: boolean

  // Default view preferences
  default_calendar_view: 'month' | 'list'

  // UI preferences
  theme: 'light' | 'dark' | 'system'
}

const DEFAULT_PREFERENCES: UserPreferences = {
  show_shifts: true,
  show_time_off: true,
  show_financial_records: true,
  show_income_records: true,
  show_expense_records: true,
  show_shift_income_card: true,
  show_fixed_income_card: true,
  show_other_income_card: true,
  show_expense_card: true,
  default_calendar_view: 'month',
  theme: 'system',
}

const STORAGE_KEY = 'user_preferences'

// ============================================================================
// LOCALSTORAGE OPERATIONS (instant, client-side only)
// ============================================================================

/**
 * Get preferences from localStorage
 */
export function getLocalPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...DEFAULT_PREFERENCES, ...parsed }
    }
  } catch (error) {
    console.error('Error reading preferences from localStorage:', error)
  }

  return DEFAULT_PREFERENCES
}

/**
 * Save preferences to localStorage
 */
export function setLocalPreferences(preferences: Partial<UserPreferences>): void {
  if (typeof window === 'undefined') return

  try {
    const current = getLocalPreferences()
    const updated = { ...current, ...preferences }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Error saving preferences to localStorage:', error)
  }
}

/**
 * Clear localStorage preferences
 */
export function clearLocalPreferences(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

// ============================================================================
// DATABASE OPERATIONS (persistent across devices)
// ============================================================================

/**
 * Get preferences from database
 */
export async function getDatabasePreferences(): Promise<UserPreferences> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return DEFAULT_PREFERENCES
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      // If no preferences exist, create default ones
      await createDatabasePreferences()
      return DEFAULT_PREFERENCES
    }

    return {
      show_shifts: data.show_shifts ?? DEFAULT_PREFERENCES.show_shifts,
      show_time_off: data.show_time_off ?? DEFAULT_PREFERENCES.show_time_off,
      show_financial_records: data.show_financial_records ?? DEFAULT_PREFERENCES.show_financial_records,
      show_income_records: data.show_income_records ?? DEFAULT_PREFERENCES.show_income_records,
      show_expense_records: data.show_expense_records ?? DEFAULT_PREFERENCES.show_expense_records,
      show_shift_income_card: data.show_shift_income_card ?? DEFAULT_PREFERENCES.show_shift_income_card,
      show_fixed_income_card: data.show_fixed_income_card ?? DEFAULT_PREFERENCES.show_fixed_income_card,
      show_other_income_card: data.show_other_income_card ?? DEFAULT_PREFERENCES.show_other_income_card,
      show_expense_card: data.show_expense_card ?? DEFAULT_PREFERENCES.show_expense_card,
      default_calendar_view: (data.default_calendar_view as 'month' | 'list') ?? DEFAULT_PREFERENCES.default_calendar_view,
      theme: (data.theme as 'light' | 'dark' | 'system') ?? DEFAULT_PREFERENCES.theme,
    }
  } catch (error) {
    console.error('Error fetching preferences from database:', error)
    return DEFAULT_PREFERENCES
  }
}

/**
 * Create default preferences in database for new user
 */
async function createDatabasePreferences(): Promise<void> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    await supabase
      .from('user_preferences')
      .insert({
        user_id: user.id,
        ...DEFAULT_PREFERENCES,
      })
  } catch (error) {
    console.error('Error creating default preferences:', error)
  }
}

/**
 * Save preferences to database
 */
export async function setDatabasePreferences(preferences: Partial<UserPreferences>): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    const { error } = await supabase
      .from('user_preferences')
      .update(preferences)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating preferences in database:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error saving preferences to database:', error)
    return false
  }
}

// ============================================================================
// SYNCED OPERATIONS (localStorage + database)
// ============================================================================

/**
 * Get preferences (from localStorage first, fallback to database)
 */
export async function getPreferences(): Promise<UserPreferences> {
  // Try localStorage first (instant)
  const local = getLocalPreferences()

  // If localStorage has values, use them
  if (local) {
    return local
  }

  // Otherwise fetch from database and cache to localStorage
  const database = await getDatabasePreferences()
  setLocalPreferences(database)
  return database
}

/**
 * Save preferences to both localStorage and database
 * Updates localStorage instantly, then syncs to database in background
 */
export async function setPreferences(preferences: Partial<UserPreferences>): Promise<void> {
  // Update localStorage instantly (no await)
  setLocalPreferences(preferences)

  // Sync to database in background (don't block UI)
  setDatabasePreferences(preferences).catch((error) => {
    console.error('Failed to sync preferences to database:', error)
  })
}

/**
 * Load preferences from database and sync to localStorage
 * Useful for syncing when user logs in on a new device
 */
export async function syncPreferencesFromDatabase(): Promise<UserPreferences> {
  const database = await getDatabasePreferences()
  setLocalPreferences(database)
  return database
}
