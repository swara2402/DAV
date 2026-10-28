import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  PlusCircle,
  Utensils,
  Wallet,
  Sparkles,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import { Layout } from '../components/Layout'
import { ExpenseModal } from '../components/ExpenseModal'
import { TaskModal } from '../components/TaskModal'
import { useAuth } from '../contexts/AuthContext'
import { getDashboardSummary, getInsight } from '../lib/api'
import type { DashboardSummary, InsightData } from '../types'
import { formatINR, formatDate } from '../lib/utils'

export const Dashboard: React.FC = () => {
  const { activePersona } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [insight, setInsight] = useState<InsightData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)

  // Period state
  const [periodDays, setPeriodDays] = useState<number>(84) // 12 weeks = 84 days

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const today = new Date()
      const endStr = today.toISOString().slice(0, 10)
      const startDate = new Date(today.getTime() - periodDays * 24 * 60 * 60 * 1000)
      const startStr = startDate.toISOString().slice(0, 10)

      const [sumData, insData] = await Promise.all([
        getDashboardSummary(startStr, endStr),
        getInsight(),
      ])
      setSummary(sumData)
      setInsight(insData)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [periodDays, activePersona])

  // Convenience food share percentage
  const cfShare =
    summary && summary.total_spending > 0
      ? Math.round((summary.convenience_food_spending / summary.total_spending) * 100)
      : 0

  return (
    <Layout
      onAddExpense={() => setIsExpenseModalOpen(true)}
      onAddTask={() => setIsTaskModalOpen(true)}
    >
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'},{' '}
              {activePersona === 'maya'
                ? 'Maya'
                : activePersona === 'arjun'
                ? 'Arjun'
                : 'Explorer'}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium border border-stone-200 dark:border-stone-700">
              {activePersona === 'fresh' ? 'Personal' : 'Demo Dataset'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            Observation period: {formatDate(summary?.period_start)} → {formatDate(summary?.period_end)}
          </p>
        </div>

        {/* Period Selector & Quick Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            value={periodDays}
            onChange={(e) => setPeriodDays(Number(e.target.value))}
            className="text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-stone-700 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <option value={84}>Last 12 Weeks (Full Model)</option>
            <option value={30}>Last 30 Days</option>
            <option value={14}>Last 2 Weeks</option>
          </select>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium shadow-sm transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 text-xs text-red-600 dark:text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchData}
            className="px-2.5 py-1 rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Prominent Insight Engine Card */}
      {insight && (
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-green-50/80 via-white to-stone-50 dark:from-[#132219] dark:via-[#1A1A19] dark:to-[#141413] border border-green-200/80 dark:border-green-900/60 shadow-md relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/60 text-green-800 dark:text-green-300 text-[11px] font-semibold tracking-wide uppercase">
                <Sparkles className="w-3 h-3" />
                <span>Calculated Finding</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                {insight.headline}
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                {insight.status === 'sufficient' ? (
                  <>
                    Derived from {insight.total_weeks_analyzed} weeks of historical records.{' '}
                    In {insight.qualifying_week_count} high-stress weeks (≥3 overdue tasks), convenience food
                    averaged <strong className="text-stone-900 dark:text-stone-100">{formatINR(insight.qualifying_avg)}</strong> vs{' '}
                    <strong className="text-stone-900 dark:text-stone-100">{formatINR(insight.baseline_avg)}</strong> during {insight.baseline_week_count} baseline weeks.
                  </>
                ) : (
                  <>
                    Data accumulation in progress. Life, Decoded requires at least 3 qualifying weeks and
                    3 baseline weeks to report a statistically confident ratio.
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 shrink-0">
              {insight.ratio && (
                <div className="text-left md:text-right">
                  <div className="text-3xl font-extrabold text-green-600 dark:text-green-400">
                    {insight.ratio.toFixed(1)}×
                  </div>
                  <div className="text-[11px] text-stone-500 font-medium">Observed Differential</div>
                </div>
              )}
              <Link
                to="/insight"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold shadow-sm transition"
              >
                <span>Inspect Evidence &amp; Calculation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4 Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Total Spending */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1A19] border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Total Spending
            </span>
            <Wallet className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight">
            {loading ? '...' : formatINR(summary?.total_spending || 0)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">For selected period</div>
        </div>

        {/* Card 2: Convenience Food */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1A19] border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Convenience Food
            </span>
            <Utensils className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {loading ? '...' : formatINR(summary?.convenience_food_spending || 0)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">{cfShare}% of total spending</div>
        </div>

        {/* Card 3: Tasks Completed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1A19] border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Tasks Completed
            </span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
            {loading ? '...' : summary?.tasks_completed ?? 0}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Closed successfully</div>
        </div>

        {/* Card 4: Tasks Overdue */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1A19] border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Currently Overdue
            </span>
            <Clock className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
            {loading ? '...' : summary?.tasks_overdue ?? 0}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            {summary?.tasks_upcoming ?? 0} tasks upcoming
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Spending Breakdown AreaChart */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#1A1A19] border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Weekly Spending Trend
              </h3>
              <p className="text-[11px] text-stone-500">
                Total expenditure vs convenience food delivery (INR)
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            {summary?.weekly_spending && summary.weekly_spending.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.weekly_spending} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="week_start"
                    tickFormatter={(val) => val.slice(5)}
                    tick={{ fontSize: 11 }}
                    stroke="#888888"
                  />
                  <YAxis
                    tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                    tick={{ fontSize: 11 }}
                    stroke="#888888"
                  />
                  <Tooltip
                    formatter={(val: any) => [formatINR(Number(val)), '']}
                    labelFormatter={(label) => `Week of ${label}`}
                    contentStyle={{
                      backgroundColor: '#1C1917',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Spending"
                    stroke="#78716C"
                    fill="#E7E5E4"
                    fillOpacity={0.4}
                  />
                  <Area
                    type="monotone"
                    dataKey="convenience_food"
                    name="Convenience Food"
                    stroke="#16A34A"
                    fill="#16A34A"
                    fillOpacity={0.3}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-stone-400">
                No weekly data available yet.
              </div>
            )}
          </div>
        </div>

        {/* Task Overload vs Convenience Food BarChart */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#1A1A19] border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Task Backlog vs Convenience Food
              </h3>
              <p className="text-[11px] text-stone-500">
                Overdue count at Sunday snapshot vs food delivery spend
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            {insight?.weekly_breakdown && insight.weekly_breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={insight.weekly_breakdown}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="week_start"
                    tickFormatter={(val) => val.slice(5)}
                    tick={{ fontSize: 11 }}
                    stroke="#888888"
                  />
                  <YAxis
                    tickFormatter={(val) => `₹${val}`}
                    tick={{ fontSize: 11 }}
                    stroke="#888888"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1C1917',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, name: any) => [
                      name === 'convenience_food_spending' ? formatINR(Number(val)) : val,
                      name === 'convenience_food_spending' ? 'Food Spending' : 'Overdue Tasks',
                    ]}
                  />
                  <Bar
                    dataKey="convenience_food_spending"
                    name="Convenience Food (₹)"
                    fill="#16A34A"
                    radius={[4, 4, 0, 0]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-stone-400">
                No breakdown data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={fetchData}
      />
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={fetchData}
      />
    </Layout>
  )
}
