/**
 * User Settings Management
 * Syncs settings between localStorage (instant) and database (persistent across devices)
 * Handles language, theme, currency preferences, and other user-level settings
 */

import { createClient } from '@/lib/supabase/client'

export type Language = 'en' | 'uk'

export interface UserSettings {
  // Localization
  language: Language

  // Currency preferences
  default_currency: string | null
  primary_currency: string | null
  auto_convert_currency: boolean | null
  show_currency_breakdown: boolean | null

  // UI preferences
  theme: 'light' | 'dark' | 'system' | null
  clock_style: string | null

  // Other settings
  dashboard_layout: any | null
  notification_prefs: any | null
}

const DEFAULT_SETTINGS: UserSettings = {
  language: 'en',
  default_currency: 'USD',
  primary_currency: 'USD',
  auto_convert_currency: false,
  show_currency_breakdown: true,
  theme: 'system',
  clock_style: '24h',
  dashboard_layout: null,
  notification_prefs: null,
}

const STORAGE_KEY = 'user_settings'

// ============================================================================
// LOCALSTORAGE OPERATIONS (instant, client-side only)
// ============================================================================

/**
 * Get settings from localStorage
 */
export function getLocalSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch (error) {
    console.error('Error reading settings from localStorage:', error)
  }

  return DEFAULT_SETTINGS
}

/**
 * Save settings to localStorage
 */
export function setLocalSettings(settings: Partial<UserSettings>): void {
  if (typeof window === 'undefined') return

  try {
    const current = getLocalSettings()
    const updated = { ...current, ...settings }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Error saving settings to localStorage:', error)
  }
}

/**
 * Clear localStorage settings
 */
export function clearLocalSettings(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

// ============================================================================
// DATABASE OPERATIONS (persistent across devices)
// ============================================================================

/**
 * Get settings from database
 */
export async function getDatabaseSettings(): Promise<UserSettings> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return DEFAULT_SETTINGS
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      // If no settings exist, create default ones
      await createDatabaseSettings()
      return DEFAULT_SETTINGS
    }

    return {
      language: (data.language as Language) ?? DEFAULT_SETTINGS.language,
      default_currency: data.default_currency ?? DEFAULT_SETTINGS.default_currency,
      primary_currency: data.primary_currency ?? DEFAULT_SETTINGS.primary_currency,
      auto_convert_currency: data.auto_convert_currency ?? DEFAULT_SETTINGS.auto_convert_currency,
      show_currency_breakdown: data.show_currency_breakdown ?? DEFAULT_SETTINGS.show_currency_breakdown,
      theme: (data.theme as 'light' | 'dark' | 'system' | null) ?? DEFAULT_SETTINGS.theme,
      clock_style: data.clock_style ?? DEFAULT_SETTINGS.clock_style,
      dashboard_layout: data.dashboard_layout ?? DEFAULT_SETTINGS.dashboard_layout,
      notification_prefs: data.notification_prefs ?? DEFAULT_SETTINGS.notification_prefs,
    }
  } catch (error) {
    console.error('Error fetching settings from database:', error)
    return DEFAULT_SETTINGS
  }
}

/**
 * Create default settings in database for new user
 */
async function createDatabaseSettings(): Promise<void> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    await supabase
      .from('user_settings')
      .insert({
        user_id: user.id,
        language: DEFAULT_SETTINGS.language,
        default_currency: DEFAULT_SETTINGS.default_currency,
        primary_currency: DEFAULT_SETTINGS.primary_currency,
        auto_convert_currency: DEFAULT_SETTINGS.auto_convert_currency,
        show_currency_breakdown: DEFAULT_SETTINGS.show_currency_breakdown,
        theme: DEFAULT_SETTINGS.theme,
        clock_style: DEFAULT_SETTINGS.clock_style,
      })
  } catch (error) {
    console.error('Error creating default settings:', error)
  }
}

/**
 * Save settings to database
 */
export async function setDatabaseSettings(settings: Partial<UserSettings>): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    const { error } = await supabase
      .from('user_settings')
      .update(settings)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating settings in database:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error saving settings to database:', error)
    return false
  }
}

// ============================================================================
// SYNCED OPERATIONS (localStorage + database)
// ============================================================================

/**
 * Get settings (from localStorage first, fallback to database)
 */
export async function getSettings(): Promise<UserSettings> {
  // Try localStorage first (instant)
  const local = getLocalSettings()

  // If localStorage has values, use them
  if (local && local.language) {
    return local
  }

  // Otherwise fetch from database and cache to localStorage
  const database = await getDatabaseSettings()
  setLocalSettings(database)
  return database
}

/**
 * Save settings to both localStorage and database
 * Updates localStorage instantly, then syncs to database in background
 */
export async function setSettings(settings: Partial<UserSettings>): Promise<void> {
  // Update localStorage instantly (no await)
  setLocalSettings(settings)

  // Sync to database in background (don't block UI)
  setDatabaseSettings(settings).catch((error) => {
    console.error('Failed to sync settings to database:', error)
  })
}

/**
 * Load settings from database and sync to localStorage
 * Useful for syncing when user logs in on a new device
 */
export async function syncSettingsFromDatabase(): Promise<UserSettings> {
  const database = await getDatabaseSettings()
  setLocalSettings(database)
  return database
}
