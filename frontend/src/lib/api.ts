import type {
  DashboardSummary,
  Expense,
  ExpenseCategory,
  FollowupOutcome,
  InsightData,
  PersonaType,
  Profile,
  Task,
  TaskCategory,
  ActionItem,
} from '../types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('ld_auth_token')
  if (token) {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status} ${response.statusText}`
    try {
      const errorData = await response.json()
      if (errorData.detail) {
        errorMessage = typeof errorData.detail === 'string'
          ? errorData.detail
          : JSON.stringify(errorData.detail)
      }
    } catch {
      // Use fallback error message
    }
    throw new Error(errorMessage)
  }

  if (response.status === 204) {
    return null as T
  }

  return response.json()
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
export async function getHealth(): Promise<{ status: string; version: string; environment: string }> {
  return request('/health')
}

// ---------------------------------------------------------------------------
// Profiles & Demo
// ---------------------------------------------------------------------------
export async function getProfile(): Promise<Profile> {
  return request('/api/v1/profiles/me')
}

export async function selectPersona(persona: PersonaType): Promise<{
  success: boolean
  persona: string
  seeded: boolean
  already_seeded: boolean
  record_counts: Record<string, number>
  synthetic_disclosure: string
}> {
  return request('/api/v1/demo/select-persona', {
    method: 'POST',
    body: JSON.stringify({ persona }),
  })
}

export async function resetDemo(): Promise<{ success: boolean; message: string }> {
  return request('/api/v1/demo/reset', {
    method: 'POST',
    body: JSON.stringify({ confirm: true }),
  })
}

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------
export async function importExpensesCsv(csvText: string): Promise<{
  imported: number
  skipped: number
  total_rows: number
  source: string
  errors: Array<{ line: number; reason: string }>
  note: string
}> {
  return request('/api/v1/expenses/import-csv', {
    method: 'POST',
    body: csvText,
    headers: { 'Content-Type': 'text/csv' },
  })
}


export async function getExpenses(params?: {
  start_date?: string
  end_date?: string
  category?: string
  page?: number
  page_size?: number
}): Promise<Expense[]> {
  const query = new URLSearchParams()
  if (params?.start_date) query.append('start_date', params.start_date)
  if (params?.end_date) query.append('end_date', params.end_date)
  if (params?.category) query.append('category', params.category)
  if (params?.page) query.append('page', params.page.toString())
  if (params?.page_size) query.append('page_size', params.page_size.toString())

  const qs = query.toString() ? `?${query.toString()}` : ''
  return request(`/api/v1/expenses${qs}`)
}

export async function createExpense(data: {
  date: string
  amount: number
  category: ExpenseCategory
  description?: string
}): Promise<Expense> {
  return request('/api/v1/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateExpense(
  id: string,
  data: Partial<{
    date: string
    amount: number
    category: ExpenseCategory
    description: string
  }>
): Promise<Expense> {
  return request(`/api/v1/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteExpense(id: string): Promise<void> {
  return request(`/api/v1/expenses/${id}`, {
    method: 'DELETE',
  })
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------
export async function getTasks(params?: {
  category?: string
  status?: 'completed' | 'open' | 'overdue'
}): Promise<Task[]> {
  const query = new URLSearchParams()
  if (params?.category) query.append('category', params.category)
  if (params?.status) query.append('status', params.status)

  const qs = query.toString() ? `?${query.toString()}` : ''
  return request(`/api/v1/tasks${qs}`)
}

export async function createTask(data: {
  title: string
  category?: TaskCategory
  due_date?: string
  completed_at?: string
  created_at?: string
}): Promise<Task> {
  return request('/api/v1/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateTask(
  id: string,
  data: Partial<{
    title: string
    category: TaskCategory
    due_date: string
    completed_at: string
  }>
): Promise<Task> {
  return request(`/api/v1/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function completeTask(id: string, completed_at: string): Promise<Task> {
  return request(`/api/v1/tasks/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify({ completed_at }),
  })
}

export async function deleteTask(id: string): Promise<void> {
  return request(`/api/v1/tasks/${id}`, {
    method: 'DELETE',
  })
}

// ---------------------------------------------------------------------------
// Dashboard & Insights
// ---------------------------------------------------------------------------
export async function getDashboardSummary(
  start_date?: string,
  end_date?: string
): Promise<DashboardSummary> {
  const query = new URLSearchParams()
  if (start_date) query.append('start_date', start_date)
  if (end_date) query.append('end_date', end_date)
  const qs = query.toString() ? `?${query.toString()}` : ''
  return request(`/api/v1/dashboard/summary${qs}`)
}

export async function getInsight(): Promise<InsightData> {
  return request('/api/v1/insights/overdue-convenience')
}

// ---------------------------------------------------------------------------
// Actions & Followup
// ---------------------------------------------------------------------------
export async function createAction(data: {
  action_text: string
  insight_id?: string
}): Promise<ActionItem> {
  return request('/api/v1/actions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function listActions(): Promise<ActionItem[]> {
  return request('/api/v1/actions')
}

export async function getFollowup(actionId: string): Promise<FollowupOutcome> {
  return request(`/api/v1/actions/${actionId}/followup`)
}

