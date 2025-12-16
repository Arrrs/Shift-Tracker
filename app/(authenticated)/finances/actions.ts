'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/lib/database.types'
import { redirect } from 'next/navigation'

type FinancialRecordInsert = Database['public']['Tables']['financial_records']['Insert']
type FinancialCategoryInsert = Database['public']['Tables']['financial_categories']['Insert']

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return { user, supabase }
}

// ============================================================================
// FINANCIAL RECORDS
// ============================================================================

// Get financial records for a date range
export async function getFinancialRecords(startDate: string, endDate: string, type?: 'income' | 'expense') {
  const { user, supabase } = await getAuthenticatedUser()

  let query = supabase
    .from('financial_records')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  // Filter by type if provided
  if (type) {
    query = query.eq('type', type)
  }

  const { data: records, error } = await query

  if (error) {
    return { error: error.message, records: null }
  }

  // Fetch related data manually
  if (records && records.length > 0) {
    // Get unique job IDs and category IDs
    const jobIds = [...new Set(records.map(r => r.job_id).filter(Boolean))]
    const categoryIds = [...new Set(records.map(r => r.category_id).filter(Boolean))]

    // Fetch jobs
    let jobsMap: Record<string, any> = {}
    if (jobIds.length > 0) {
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, name, color')
        .in('id', jobIds)

      if (jobs) {
        jobsMap = Object.fromEntries(jobs.map(job => [job.id, job]))
      }
    }

    // Fetch categories
    let categoriesMap: Record<string, any> = {}
    if (categoryIds.length > 0) {
      const { data: categories } = await supabase
        .from('financial_categories')
        .select('id, name, icon, color')
        .in('id', categoryIds)

      if (categories) {
        categoriesMap = Object.fromEntries(categories.map(cat => [cat.id, cat]))
      }
    }

    // Combine data
    const enrichedRecords = records.map(record => ({
      ...record,
      jobs: record.job_id ? jobsMap[record.job_id] || null : null,
      financial_categories: record.category_id ? categoriesMap[record.category_id] || null : null,
    }))

    return { records: enrichedRecords, error: null }
  }

  return { records, error: null }
}

// Create a new financial record
export async function createFinancialRecord(data: Omit<FinancialRecordInsert, 'user_id'>) {
  const { user, supabase } = await getAuthenticatedUser()

  const { data: record, error } = await supabase
    .from('financial_records')
    .insert({
      ...data,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/calendar')
  revalidatePath('/finances')

  return { success: true, record }
}

// Update a financial record
export async function updateFinancialRecord(
  recordId: string,
  data: Partial<Omit<FinancialRecordInsert, 'user_id'>>
) {
  const { user, supabase } = await getAuthenticatedUser()

  const { data: record, error } = await supabase
    .from('financial_records')
    .update(data)
    .eq('id', recordId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/calendar')
  revalidatePath('/finances')

  return { success: true, record }
}

// Delete a financial record
export async function deleteFinancialRecord(recordId: string) {
  const { user, supabase } = await getAuthenticatedUser()

  const { error } = await supabase
    .from('financial_records')
    .delete()
    .eq('id', recordId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/calendar')
  revalidatePath('/finances')

  return { success: true }
}

// ============================================================================
// CATEGORIES
// ============================================================================

// Get categories by type
export async function getCategories(type?: 'income' | 'expense') {
  const { user, supabase } = await getAuthenticatedUser()

  let query = supabase
    .from('financial_categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  if (type) {
    query = query.eq('type', type)
  }

  const { data: categories, error } = await query

  if (error) {
    return { error: error.message, categories: null }
  }

  return { categories, error: null }
}

// Create a new category
export async function createCategory(data: Omit<FinancialCategoryInsert, 'user_id'>) {
  const { user, supabase } = await getAuthenticatedUser()

  const { data: category, error } = await supabase
    .from('financial_categories')
    .insert({
      ...data,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { success: true, category }
}

// Update a category
export async function updateCategory(
  categoryId: string,
  data: Partial<Omit<FinancialCategoryInsert, 'user_id'>>
) {
  const { user, supabase } = await getAuthenticatedUser()

  const { data: category, error } = await supabase
    .from('financial_categories')
    .update(data)
    .eq('id', categoryId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { success: true, category }
}

// Delete a category
export async function deleteCategory(categoryId: string) {
  const { user, supabase } = await getAuthenticatedUser()

  const { error } = await supabase
    .from('financial_categories')
    .delete()
    .eq('id', categoryId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

// ============================================================================
// FINANCIAL SUMMARY
// ============================================================================

// Get monthly financial summary (income/expense breakdown by currency)
export async function getMonthlyFinancialSummary(year: number, month: number) {
  const { user, supabase } = await getAuthenticatedUser()

  // Calculate start and end dates for the month
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const { data: records, error } = await supabase
    .from('financial_records')
    .select(`
      id,
      type,
      amount,
      currency,
      financial_categories (
        name,
        icon
      )
    `)
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) {
    return { error: error.message, summary: null }
  }

  // Group by currency and type
  const summaryByCurrency: Record<string, {
    income: number
    expense: number
    incomeByCategory: Record<string, { amount: number; icon: string }>
    expenseByCategory: Record<string, { amount: number; icon: string }>
  }> = {}

  records?.forEach((record) => {
    const currency = record.currency || 'USD'
    const category = Array.isArray(record.financial_categories)
      ? record.financial_categories[0]
      : record.financial_categories
    const categoryName = category?.name || 'Uncategorized'
    const categoryIcon = category?.icon || '💰'

    if (!summaryByCurrency[currency]) {
      summaryByCurrency[currency] = {
        income: 0,
        expense: 0,
        incomeByCategory: {},
        expenseByCategory: {},
      }
    }

    if (record.type === 'income') {
      summaryByCurrency[currency].income += Number(record.amount)
      if (!summaryByCurrency[currency].incomeByCategory[categoryName]) {
        summaryByCurrency[currency].incomeByCategory[categoryName] = {
          amount: 0,
          icon: categoryIcon,
        }
      }
      summaryByCurrency[currency].incomeByCategory[categoryName].amount += Number(record.amount)
    } else {
      summaryByCurrency[currency].expense += Number(record.amount)
      if (!summaryByCurrency[currency].expenseByCategory[categoryName]) {
        summaryByCurrency[currency].expenseByCategory[categoryName] = {
          amount: 0,
          icon: categoryIcon,
        }
      }
      summaryByCurrency[currency].expenseByCategory[categoryName].amount += Number(record.amount)
    }
  })

  return { summary: summaryByCurrency, error: null }
}

// ============================================================================
// FIXED INCOME (from jobs with show_in_fixed_income = true)
// ============================================================================

// Get fixed income for a month (monthly/salary jobs)
export async function getFixedIncomeForMonth(year: number, month: number) {
  const { user, supabase } = await getAuthenticatedUser()

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', user.id)
    .eq('show_in_fixed_income', true)
    .eq('is_active', true)

  if (error) {
    return { error: error.message, fixedIncome: null }
  }

  // Calculate monthly income by currency
  const fixedIncomeByCurrency: Record<string, {
    total: number
    byJob: Array<{
      jobId: string
      jobName: string
      amount: number
      payType: string
    }>
  }> = {}

  jobs?.forEach((job) => {
    const currency = job.currency || 'USD'
    let monthlyAmount = 0

    if (job.pay_type === 'monthly') {
      monthlyAmount = job.monthly_salary || 0
    } else if (job.pay_type === 'salary') {
      // Convert annual salary to monthly (stored value is annual)
      monthlyAmount = (job.monthly_salary || 0) / 12
    }

    if (monthlyAmount > 0) {
      if (!fixedIncomeByCurrency[currency]) {
        fixedIncomeByCurrency[currency] = {
          total: 0,
          byJob: [],
        }
      }

      fixedIncomeByCurrency[currency].total += monthlyAmount
      fixedIncomeByCurrency[currency].byJob.push({
        jobId: job.id,
        jobName: job.name,
        amount: monthlyAmount,
        payType: job.pay_type || 'monthly',
      })
    }
  })

  return { fixedIncome: fixedIncomeByCurrency, error: null }
}
