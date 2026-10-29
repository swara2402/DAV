export type PersonaType = 'maya' | 'arjun' | 'fresh'

export type ExpenseCategory =
  | 'convenience_food'
  | 'groceries'
  | 'transport'
  | 'shopping'
  | 'bills'
  | 'other'

export type TaskCategory =
  | 'work'
  | 'personal'
  | 'health'
  | 'finance'
  | 'household'
  | 'other'

export interface Profile {
  id: string
  email: string
  name: string | null
  currency: string
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  user_id: string
  date: string
  amount: number
  category: ExpenseCategory
  description: string | null
  data_source?: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  category: TaskCategory
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface WeekDetail {
  week_start: string
  week_end: string
  overdue_count: number
  convenience_food_spending: number
  overdue_task_titles: string[]
}

export interface WeeklyBreakdownItem {
  week_start: string
  week_end: string
  snapshot: string
  overdue_count: number
  convenience_food_spending: number
  overdue_task_titles: string[]
  is_qualifying: boolean
  group: 'qualifying' | 'baseline'
}

export interface InsightData {
  insight_type: string
  status: 'sufficient' | 'insufficient_data'
  headline: string
  observation_start: string | null
  observation_end: string | null
  timezone: string
  week_start_day: string
  snapshot_convention: string
  overdue_threshold: number
  qualifying_weeks: WeekDetail[]
  baseline_weeks: WeekDetail[]
  qualifying_week_count: number
  baseline_week_count: number
  qualifying_avg: number | null
  baseline_avg: number | null
  ratio: number | null
  formula: string
  formula_version: string
  recommended_action: string
  possible_explanation: string
  data_source: string
  engine_version: string
  min_qualifying_weeks_required: number
  min_baseline_weeks_required: number
  insufficient_reason: string | null
  total_weeks_analyzed: number
  weekly_breakdown: WeeklyBreakdownItem[]
}

export interface DashboardSummary {
  period_start: string
  period_end: string
  total_spending: number
  convenience_food_spending: number
  tasks_completed: number
  tasks_upcoming: number
  tasks_overdue: number
  weekly_spending: Array<{
    week_start: string
    total: number
    convenience_food: number
  }>
  spending_by_category: Record<string, number>
}

export interface ActionItem {
  id: string
  user_id: string
  insight_id: string | null
  action_text: string
  created_at: string
  followup_window_days: number
  status: 'pending' | 'sufficient_data' | 'insufficient_data'
}

export interface FollowupOutcome {
  action_id: string
  action_text: string
  tried_at: string
  evaluation_date: string
  followup_window_days: number
  days_elapsed: number
  status: 'insufficient_data' | 'sufficient_data'
  message: string
  baseline_cf_avg?: number | null
  followup_cf_avg?: number | null
  percent_change?: number | null
  causation_disclaimer: string
}
