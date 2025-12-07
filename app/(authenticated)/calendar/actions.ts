'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/lib/database.types'
import { redirect } from 'next/navigation'

type ShiftInsert = Database['public']['Tables']['shifts']['Insert']

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return { user, supabase }
}

// Get shifts for a date range
export async function getShifts(startDate: string, endDate: string, jobId?: string) {
  const { user, supabase } = await getAuthenticatedUser()

  let query = supabase
    .from('shifts')
    .select(`
      *,
      jobs (
        id,
        name,
        color,
        hourly_rate,
        currency
      )
    `)
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  // Filter by job if provided
  if (jobId) {
    query = query.eq('job_id', jobId)
  }

  const { data: shifts, error } = await query

  if (error) {
    return { error: error.message, shifts: null }
  }

  return { shifts, error: null }
}

// Get shift statistics for a date range (multi-currency aware)
export async function getShiftStats(startDate: string, endDate: string) {
  const { user, supabase } = await getAuthenticatedUser()

  const { data: shifts, error } = await supabase
    .from('shifts')
    .select(`
      id,
      actual_hours,
      scheduled_hours,
      status,
      jobs (
        hourly_rate,
        currency,
        currency_symbol
      )
    `)
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) {
    return { error: error.message, stats: null }
  }

  // Group earnings by currency
  const earningsByCurrency: Record<string, number> = {}

  shifts.forEach((shift) => {
    const hours = shift.actual_hours || 0
    const rate = shift.jobs?.hourly_rate || 0
    const currency = shift.jobs?.currency || 'USD'

    if (!earningsByCurrency[currency]) {
      earningsByCurrency[currency] = 0
    }
    earningsByCurrency[currency] += hours * rate
  })

  const stats = {
    // Total hours (actual vs scheduled)
    totalActualHours: shifts.reduce((sum, shift) => sum + (shift.actual_hours || 0), 0),
    totalScheduledHours: shifts.reduce((sum, shift) => sum + (shift.scheduled_hours || 0), 0),

    // Shift counts by status
    totalShifts: shifts.length,
    completedShifts: shifts.filter(s => s.status === 'completed').length,
    plannedShifts: shifts.filter(s => s.status === 'planned').length,
    inProgressShifts: shifts.filter(s => s.status === 'in_progress').length,

    // Earnings by currency
    earningsByCurrency,

    // Legacy total (for backward compatibility - uses first currency)
    totalEarnings: Object.values(earningsByCurrency)[0] || 0,
    totalHours: shifts.reduce((sum, shift) => sum + (shift.actual_hours || 0), 0),
    shiftCount: shifts.length,
  }

  return { stats, error: null }
}

// Create a new shift
export async function createShift(data: Omit<ShiftInsert, 'user_id'>) {
  const { user, supabase } = await getAuthenticatedUser()

  // Auto-set status based on date
  let status = data.status || 'planned'
  if (data.date) {
    const shiftDate = new Date(data.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (shiftDate < today) {
      status = 'completed' // Past shifts default to completed
    }
  }

  const { data: shift, error } = await supabase
    .from('shifts')
    .insert({
      ...data,
      user_id: user.id,
      status,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/calendar')

  return { success: true, shift }
}

// Update a shift
export async function updateShift(shiftId: string, data: Partial<Omit<ShiftInsert, 'user_id'>>) {
  const { user, supabase } = await getAuthenticatedUser()

  const { data: shift, error } = await supabase
    .from('shifts')
    .update(data)
    .eq('id', shiftId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/calendar')

  return { success: true, shift }
}

// Delete a shift
export async function deleteShift(shiftId: string) {
  const { user, supabase } = await getAuthenticatedUser()

  const { error } = await supabase
    .from('shifts')
    .delete()
    .eq('id', shiftId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/calendar')

  return { success: true }
}
