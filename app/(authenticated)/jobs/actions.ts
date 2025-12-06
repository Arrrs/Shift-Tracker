'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/lib/database.types'
import { redirect } from 'next/navigation'

type JobInsert = Database['public']['Tables']['jobs']['Insert']
type ShiftTemplateInsert = Database['public']['Tables']['shift_templates']['Insert']

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return { user, supabase }
}

export async function createJob(data: Omit<JobInsert, 'user_id'>) {
  const { user, supabase } = await getAuthenticatedUser()
  
  // Insert job with user_id
  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      ...data,
      user_id: user.id
    })
    .select()
    .single()
  
  if (error) {
    return { error: error.message }
  }
  
  // Revalidate the jobs page to show new data
  revalidatePath('/jobs')

  return { success: true, job }
}

export async function archiveJob(jobId: string) {
  const { user, supabase } = await getAuthenticatedUser()

  // Soft delete: Mark as inactive (archive)
  const { error } = await supabase
    .from('jobs')
    .update({ is_active: false })
    .eq('id', jobId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/jobs')

  return { success: true }
}

export async function unarchiveJob(jobId: string) {
  const { user, supabase } = await getAuthenticatedUser()

  // Restore: Mark as active (unarchive)
  const { error } = await supabase
    .from('jobs')
    .update({ is_active: true })
    .eq('id', jobId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/jobs')

  return { success: true }
}

export async function deleteJob(jobId: string, deleteShifts: boolean = false) {
  const { user, supabase } = await getAuthenticatedUser()

  // If deleteShifts is true, we need to manually delete shifts first
  // (since we changed CASCADE to SET NULL)
  if (deleteShifts) {
    const { error: shiftsError } = await supabase
      .from('shifts')
      .delete()
      .eq('job_id', jobId)
      .eq('user_id', user.id)

    if (shiftsError) {
      return { error: shiftsError.message }
    }
  }

  // Delete job (templates will CASCADE, shifts will SET NULL if not deleted above)
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/jobs')

  return { success: true }
}

export async function updateJob(jobId: string, data: Omit<JobInsert, 'user_id'>) {
  const { user, supabase } = await getAuthenticatedUser()

  // Update job (RLS ensures user can only update their own jobs)
  const { data: job, error } = await supabase
    .from('jobs')
    .update(data)
    .eq('id', jobId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/jobs')

  return { success: true, job }
}

export async function getJobs() {
  const { user, supabase } = await getAuthenticatedUser()

  // Fetch jobs with template and shift counts for this user
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*, shift_templates(count), shifts(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, jobs: null }
  }

  // Transform the data to include template_count and shift_count as numbers
  const jobsWithCounts = jobs?.map(job => ({
    ...job,
    template_count: job.shift_templates?.[0]?.count || 0,
    shift_count: job.shifts?.[0]?.count || 0
  }))

  return { jobs: jobsWithCounts, error: null }
}

// =====================================================
// SHIFT TEMPLATE ACTIONS
// =====================================================

export async function getShiftTemplates(jobId: string) {
  const { user, supabase } = await getAuthenticatedUser()

  // Fetch shift templates for this job
  const { data: templates, error } = await supabase
    .from('shift_templates')
    .select('*')
    .eq('job_id', jobId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, templates: null }
  }

  return { templates, error: null }
}

export async function createShiftTemplate(jobId: string, data: Omit<ShiftTemplateInsert, 'user_id' | 'job_id'>) {
  const { user, supabase } = await getAuthenticatedUser()

  // Insert shift template with user_id and job_id
  const { data: template, error } = await supabase
    .from('shift_templates')
    .insert({
      ...data,
      user_id: user.id,
      job_id: jobId
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/jobs')

  return { success: true, template }
}

export async function updateShiftTemplate(templateId: string, data: Omit<ShiftTemplateInsert, 'user_id' | 'job_id'>) {
  const { user, supabase } = await getAuthenticatedUser()

  // Update shift template (RLS ensures user can only update their own templates)
  const { data: template, error } = await supabase
    .from('shift_templates')
    .update(data)
    .eq('id', templateId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/jobs')

  return { success: true, template }
}

export async function deleteShiftTemplate(templateId: string) {
  const { user, supabase } = await getAuthenticatedUser()

  // Delete shift template (RLS ensures user can only delete their own templates)
  const { error } = await supabase
    .from('shift_templates')
    .delete()
    .eq('id', templateId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/jobs')

  return { success: true }
}