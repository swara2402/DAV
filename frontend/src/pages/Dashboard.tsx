import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  PlusCircle,
  Utensils,
  Wallet,
  AlertCircle,
  Calendar,
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
      {/* Top Header / Welcome & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'},{' '}
              {activePersona === 'maya'
                ? 'Maya'
                : activePersona === 'arjun'
                ? 'Arjun'
                : 'Explorer'}
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/20">
              {activePersona === 'fresh' ? 'Personal Workspace' : 'Synthetic Benchmark'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>
              Observation window: {formatDate(summary?.period_start)} → {formatDate(summary?.period_end)}
            </span>
          </div>
        </div>

        {/* Period Selector & Quick Actions */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="relative">
            <select
              value={periodDays}
              onChange={(e) => setPeriodDays(Number(e.target.value))}
              className="text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141416] px-3.5 py-2.5 text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-subtle cursor-pointer transition-colors"
            >
              <option value={84}>Last 12 Weeks (Full Model)</option>
              <option value={30}>Last 30 Days</option>
              <option value={14}>Last 2 Weeks</option>
            </select>
          </div>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-semibold shadow-glow-emerald-sm transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchData}
            className="px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Prominent Insight Engine Card */}
      {insight && (
        <div className="mb-8 p-1 rounded-3xl bg-gradient-to-r from-emerald-500/30 via-emerald-500/10 to-transparent shadow-premium">
          <div className="p-6 sm:p-8 rounded-[22px] bg-white dark:bg-[#141416] border border-zinc-200/60 dark:border-zinc-800/60 relative overflow-hidden">
            {/* Ambient emerald backlight */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold tracking-wider uppercase">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Calculated Finding</span>
                </div>

                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-tight">
                  {insight.headline}
                </h2>

                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                  {insight.status === 'sufficient' ? (
                    <>
                      Derived from {insight.total_weeks_analyzed} weeks of records.{' '}
                      In {insight.qualifying_week_count} high-stress weeks (≥3 overdue tasks), convenience food
                      averaged <strong className="text-zinc-950 dark:text-zinc-100 font-mono font-bold">{formatINR(insight.qualifying_avg)}</strong> vs{' '}
                      <strong className="text-zinc-950 dark:text-zinc-100 font-mono font-bold">{formatINR(insight.baseline_avg)}</strong> during {insight.baseline_week_count} baseline weeks.
                    </>
                  ) : (
                    <>
                      Data accumulation in progress. Life, Decoded requires at least 3 qualifying weeks and
                      3 baseline weeks to report a statistically confident ratio.
                    </>
                  )}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 shrink-0">
                {insight.ratio && (
                  <div className="text-left lg:text-right">
                    <div className="text-4xl sm:text-5xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                      {insight.ratio.toFixed(2)}×
                    </div>
                    <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mt-0.5">
                      Observed Multiple
                    </div>
                  </div>
                )}
                <Link
                  to="/insight"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold shadow-subtle transition-all duration-150 group"
                >
                  <span>Inspect Evidence &amp; Calculation</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4 Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
        {/* Card 1: Total Spending */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#141416] border border-zinc-200/80 dark:border-zinc-800/80 shadow-subtle hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Total Spending
            </span>
            <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-zinc-950 dark:text-white">
            {loading ? '...' : formatINR(summary?.total_spending || 0)}
          </div>
          <div className="text-[11px] font-medium text-zinc-500 mt-1.5 flex items-center gap-1">
            <span>Aggregated across {periodDays} days</span>
          </div>
        </div>

        {/* Card 2: Convenience Food */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#141416] border border-zinc-200/80 dark:border-zinc-800/80 shadow-subtle hover:border-amber-500/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Convenience Food
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-amber-600 dark:text-amber-400">
            {loading ? '...' : formatINR(summary?.convenience_food_spending || 0)}
          </div>
          <div className="text-[11px] font-semibold text-amber-600/90 dark:text-amber-400/90 mt-1.5 flex items-center gap-1">
            <span>{cfShare}% of total period spending</span>
          </div>
        </div>

        {/* Card 3: Tasks Completed */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#141416] border border-zinc-200/80 dark:border-zinc-800/80 shadow-subtle hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Tasks Completed
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
            {loading ? '...' : summary?.tasks_completed ?? 0}
          </div>
          <div className="text-[11px] font-medium text-zinc-500 mt-1.5">Closed successfully</div>
        </div>

        {/* Card 4: Tasks Overdue */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#141416] border border-zinc-200/80 dark:border-zinc-800/80 shadow-subtle hover:border-rose-500/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Currently Overdue
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-rose-600 dark:text-rose-400">
            {loading ? '...' : summary?.tasks_overdue ?? 0}
          </div>
          <div className="text-[11px] font-medium text-zinc-500 mt-1.5">
            {summary?.tasks_upcoming ?? 0} tasks upcoming
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Spending Breakdown AreaChart */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#141416] border border-zinc-200/80 dark:border-zinc-800/80 shadow-subtle">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                Weekly Spending Trend
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Total expenditure vs convenience food delivery (INR)
              </p>
            </div>
          </div>

          <div className="h-68 w-full">
            {summary?.weekly_spending && summary.weekly_spending.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={summary.weekly_spending} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#71717A" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#71717A" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="cfGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.12} stroke="#71717A" />
                  <XAxis
                    dataKey="week_start"
                    tickFormatter={(val) => val.slice(5)}
                    tick={{ fontSize: 11, fill: '#71717A', fontFamily: 'JetBrains Mono' }}
                    stroke="#71717A"
                    opacity={0.5}
                  />
                  <YAxis
                    tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                    tick={{ fontSize: 11, fill: '#71717A', fontFamily: 'JetBrains Mono' }}
                    stroke="#71717A"
                    opacity={0.5}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatINR(Number(val)), '']}
                    labelFormatter={(label) => `Week of ${label}`}
                    contentStyle={{
                      backgroundColor: '#121214',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      fontFamily: 'Plus Jakarta Sans',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Spending"
                    stroke="#71717A"
                    strokeWidth={2}
                    fill="url(#totalGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="convenience_food"
                    name="Convenience Food"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fill="url(#cfGradient)"
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px', fontWeight: 600 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                No weekly data available yet.
              </div>
            )}
          </div>
        </div>

        {/* Task Overload vs Convenience Food BarChart */}
        <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#141416] border border-zinc-200/80 dark:border-zinc-800/80 shadow-subtle">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                Task Backlog vs Convenience Food
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Overdue count at Sunday snapshot vs food delivery spend
              </p>
            </div>
          </div>

          <div className="h-68 w-full">
            {insight?.weekly_breakdown && insight.weekly_breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={insight.weekly_breakdown}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.12} stroke="#71717A" />
                  <XAxis
                    dataKey="week_start"
                    tickFormatter={(val) => val.slice(5)}
                    tick={{ fontSize: 11, fill: '#71717A', fontFamily: 'JetBrains Mono' }}
                    stroke="#71717A"
                    opacity={0.5}
                  />
                  <YAxis
                    tickFormatter={(val) => `₹${val}`}
                    tick={{ fontSize: 11, fill: '#71717A', fontFamily: 'JetBrains Mono' }}
                    stroke="#71717A"
                    opacity={0.5}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121214',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      fontFamily: 'Plus Jakarta Sans',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                    }}
                    formatter={(val: any, name: any) => [
                      name === 'convenience_food_spending' ? formatINR(Number(val)) : val,
                      name === 'convenience_food_spending' ? 'Food Spending' : 'Overdue Tasks',
                    ]}
                  />
                  <Bar
                    dataKey="convenience_food_spending"
                    name="Convenience Food (₹)"
                    fill="#10B981"
                    radius={[6, 6, 0, 0]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px', fontWeight: 600 }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400">
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
