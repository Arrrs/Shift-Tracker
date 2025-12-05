'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/lib/database.types'
import { redirect } from 'next/navigation'

type JobInsert = Database['public']['Tables']['jobs']['Insert']

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

export async function deleteJob(jobId: string) {
  const { user, supabase } = await getAuthenticatedUser()

  // Delete job (RLS ensures user can only delete their own jobs)
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

  // Fetch jobs for this user
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, jobs: null }
  }

  return { jobs, error: null }
}