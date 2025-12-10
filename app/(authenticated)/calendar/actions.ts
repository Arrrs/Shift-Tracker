'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/lib/database.types'
import { redirect } from 'next/navigation'
import { calculateShiftEarnings } from '@/lib/utils/time-format'

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
        currency,
        currency_symbol,
        pto_days_per_year,
        sick_days_per_year,
        personal_days_per_year
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
// NOW SEPARATES: Shift Income (hourly/daily) vs Fixed Income (monthly/salary)
export async function getShiftStats(startDate: string, endDate: string) {
  const { user, supabase } = await getAuthenticatedUser()

  const { data: shifts, error} = await supabase
    .from('shifts')
    .select(`
      id,
      actual_hours,
      scheduled_hours,
      status,
      shift_type,
      actual_earnings,
      earnings_currency,
      jobs!job_id (
        id,
        name,
        pay_type,
        currency,
        show_in_fixed_income
      )
    `)
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) {
    return { error: error.message, stats: null }
  }

  // Separate income by type
  const shiftIncomeByCurrency: Record<string, number> = {} // Hourly/daily only
  const shiftIncomeByJob: Record<string, { jobId: string; jobName: string; amount: number; hours: number; shifts: number }> = {}

  const fixedIncomeJobIds = new Set<string>() // Track which jobs are fixed income
  const fixedIncomeShiftCounts: Record<string, number> = {} // Count shifts per fixed income job

  const completedShifts = shifts?.filter(s => s.status === 'completed') || []

  completedShifts.forEach((shift) => {
    const hours = shift.actual_hours || 0
    const job = Array.isArray(shift.jobs) ? shift.jobs[0] : shift.jobs
    const payType = job?.pay_type || 'hourly'
    const jobId = job?.id || 'unknown'
    const jobName = job?.name || 'Unknown Job'
    const isFixedIncome = job?.show_in_fixed_income || false

    // SNAPSHOT ARCHITECTURE: Use stored actual_earnings instead of calculating
    const earnings = shift.actual_earnings || 0
    const currency = shift.earnings_currency || job?.currency || 'USD'

    // Track fixed income jobs (they have actual_earnings = NULL for time tracking only)
    if (isFixedIncome && (payType === 'monthly' || payType === 'salary')) {
      fixedIncomeJobIds.add(jobId)
      fixedIncomeShiftCounts[jobId] = (fixedIncomeShiftCounts[jobId] || 0) + 1
      return // Don't add to shift income
    }

    // Skip if no earnings (time tracking only shifts)
    if (earnings === 0 || shift.actual_earnings === null) {
      return
    }

    // Add to shift income totals (using snapshot)
    if (!shiftIncomeByCurrency[currency]) {
      shiftIncomeByCurrency[currency] = 0
    }
    shiftIncomeByCurrency[currency] += earnings

    // Track by job for breakdown
    if (!shiftIncomeByJob[jobId]) {
      shiftIncomeByJob[jobId] = {
        jobId,
        jobName,
        amount: 0,
        hours: 0,
        shifts: 0,
      }
    }
    shiftIncomeByJob[jobId].amount += earnings
    shiftIncomeByJob[jobId].hours += hours
    shiftIncomeByJob[jobId].shifts += 1
  })

  const stats = {
    // Total hours (actual vs scheduled) - only count completed shifts
    totalActualHours: completedShifts.reduce((sum, shift) => sum + (shift.actual_hours || 0), 0),
    totalScheduledHours: completedShifts.reduce((sum, shift) => sum + (shift.scheduled_hours || 0), 0),

    // Shift counts by status
    totalShifts: shifts?.length || 0,
    completedShifts: shifts?.filter(s => s.status === 'completed').length || 0,
    plannedShifts: shifts?.filter(s => s.status === 'planned').length || 0,
    inProgressShifts: shifts?.filter(s => s.status === 'in_progress').length || 0,

    // NEW: Separated income types
    shiftIncomeByCurrency, // Hourly/daily only
    shiftIncomeByJob: Object.values(shiftIncomeByJob),

    // Fixed income jobs (tracked separately, shown in Fixed Income card)
    fixedIncomeJobIds: Array.from(fixedIncomeJobIds),
    fixedIncomeShiftCounts,

    // Legacy total (for backward compatibility - uses shift income only)
    totalEarnings: Object.values(shiftIncomeByCurrency)[0] || 0,
    totalHours: completedShifts.reduce((sum, shift) => sum + (shift.actual_hours || 0), 0),
    shiftCount: shifts?.length || 0,
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

  // SNAPSHOT ARCHITECTURE: Calculate earnings at time of shift creation
  let actual_earnings = data.actual_earnings // Allow manual override
  let earnings_currency = data.earnings_currency
  let earnings_manual_override = data.earnings_manual_override || false

  // Check if user is providing manual earnings
  const isManualOverride = actual_earnings !== undefined

  // Only calculate if not manually provided AND we have a job
  if (!isManualOverride && data.job_id) {
    // Fetch job details to calculate earnings
    const { data: job } = await supabase
      .from('jobs')
      .select('pay_type, hourly_rate, daily_rate, monthly_rate, annual_salary, currency, show_in_fixed_income')
      .eq('id', data.job_id)
      .single()

    if (job) {
      earnings_currency = job.currency

      // For fixed income jobs (monthly/salary with show_in_fixed_income), set to NULL (time tracking only)
      if (job.show_in_fixed_income && (job.pay_type === 'monthly' || job.pay_type === 'salary')) {
        actual_earnings = null
        earnings_manual_override = false // Auto-calculated (NULL)
      } else {
        // Calculate and snapshot earnings using current rates
        actual_earnings = calculateShiftEarnings(
          {
            actual_hours: data.actual_hours || data.scheduled_hours,
            shift_type: data.shift_type,
            custom_hourly_rate: data.custom_hourly_rate,
            is_holiday: data.is_holiday,
            holiday_multiplier: data.holiday_multiplier,
            holiday_fixed_rate: data.holiday_fixed_rate,
          },
          job
        )
        earnings_manual_override = false // Auto-calculated
      }
    }
  } else if (isManualOverride) {
    // User provided manual earnings
    earnings_manual_override = true
  }

  const { data: shift, error } = await supabase
    .from('shifts')
    .insert({
      ...data,
      user_id: user.id,
      status,
      actual_earnings,
      earnings_currency,
      earnings_manual_override,
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

  // SNAPSHOT ARCHITECTURE: Recalculate earnings if hours or rate-related fields change
  const shouldRecalculateEarnings =
    data.actual_hours !== undefined ||
    data.scheduled_hours !== undefined ||
    data.custom_hourly_rate !== undefined ||
    data.is_holiday !== undefined ||
    data.holiday_multiplier !== undefined ||
    data.holiday_fixed_rate !== undefined ||
    data.shift_type !== undefined

  let actual_earnings = data.actual_earnings
  let earnings_currency = data.earnings_currency
  let earnings_manual_override = data.earnings_manual_override

  // User is providing manual earnings?
  const isProvidingManualEarnings = actual_earnings !== undefined

  // Fetch current shift to check override status
  let currentShift: any = null
  if (shouldRecalculateEarnings || isProvidingManualEarnings) {
    const { data: shift } = await supabase
      .from('shifts')
      .select('*, jobs(pay_type, hourly_rate, daily_rate, monthly_rate, annual_salary, currency, show_in_fixed_income)')
      .eq('id', shiftId)
      .eq('user_id', user.id)
      .single()
    currentShift = shift
  }

  // Decide whether to recalculate
  if (shouldRecalculateEarnings && !isProvidingManualEarnings && currentShift) {
    // Only recalculate if NOT manually overridden
    if (!currentShift.earnings_manual_override) {
      const job = Array.isArray(currentShift.jobs) ? currentShift.jobs[0] : currentShift.jobs

      if (job) {
        earnings_currency = job.currency

        // Merge current shift data with updates
        const mergedShift = {
          actual_hours: data.actual_hours ?? currentShift.actual_hours,
          scheduled_hours: data.scheduled_hours ?? currentShift.scheduled_hours,
          shift_type: data.shift_type ?? currentShift.shift_type,
          custom_hourly_rate: data.custom_hourly_rate ?? currentShift.custom_hourly_rate,
          is_holiday: data.is_holiday ?? currentShift.is_holiday,
          holiday_multiplier: data.holiday_multiplier ?? currentShift.holiday_multiplier,
          holiday_fixed_rate: data.holiday_fixed_rate ?? currentShift.holiday_fixed_rate,
        }

        // For fixed income jobs, set to NULL (time tracking only)
        if (job.show_in_fixed_income && (job.pay_type === 'monthly' || job.pay_type === 'salary')) {
          actual_earnings = null
          earnings_manual_override = false
        } else {
          // Recalculate and update snapshot
          actual_earnings = calculateShiftEarnings(mergedShift, job)
          earnings_manual_override = false
        }
      }
    }
    // else: Keep existing earnings (it was manually set)
  } else if (isProvidingManualEarnings) {
    // User is manually setting earnings
    earnings_manual_override = true
  }

  // Include earnings in update if they were calculated or provided
  const updateData = { ...data }
  if (actual_earnings !== undefined) {
    updateData.actual_earnings = actual_earnings
  }
  if (earnings_currency !== undefined) {
    updateData.earnings_currency = earnings_currency
  }
  if (earnings_manual_override !== undefined) {
    updateData.earnings_manual_override = earnings_manual_override
  }

  const { data: shift, error } = await supabase
    .from('shifts')
    .update(updateData)
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
