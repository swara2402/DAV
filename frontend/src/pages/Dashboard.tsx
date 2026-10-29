import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Plus,
  AlertCircle,
  Upload,
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
import { getDashboardSummary, getInsight, getExpenses, getTasks, importExpensesCsv } from '../lib/api'
import type { DashboardSummary, InsightData, Expense, Task } from '../types'
import { formatINR, formatDate, formatCategoryName } from '../lib/utils'

export const Dashboard: React.FC = () => {
  const { activePersona } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [insight, setInsight] = useState<InsightData | null>(null)
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([])
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const csvInputRef = useRef<HTMLInputElement>(null)

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

      const [sumData, insData, expData, tskData] = await Promise.all([
        getDashboardSummary(startStr, endStr),
        getInsight(),
        getExpenses({ page_size: 5 }),
        getTasks(),
      ])
      setSummary(sumData)
      setInsight(insData)
      setRecentExpenses(expData || [])
      setRecentTasks((tskData || []).slice(0, 5))
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  const handleCsvImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (activePersona !== 'fresh') {
      setImportMessage('Switch to your Personal workspace before importing private transactions.')
      return
    }
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportMessage('Please choose a CSV export from your bank or card provider.')
      return
    }
    setIsImporting(true)
    setImportMessage(null)
    try {
      const result = await importExpensesCsv(await file.text())
      setImportMessage(`Imported ${result.imported} transactions. Skipped ${result.skipped} rows. Review categories and task dates before interpreting insights.`)
      await fetchData()
    } catch (err: any) {
      setImportMessage(err.message || 'Could not import this CSV. Check the required columns and try again.')
    } finally {
      setIsImporting(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [periodDays, activePersona])

  const cfShare =
    summary && summary.total_spending > 0
      ? Math.round((summary.convenience_food_spending / summary.total_spending) * 100)
      : 0

  return (
    <Layout
      onAddExpense={() => setIsExpenseModalOpen(true)}
      onAddTask={() => setIsTaskModalOpen(true)}
    >
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'},{' '}
              {activePersona === 'maya'
                ? 'Maya'
                : activePersona === 'arjun'
                ? 'Arjun'
                : 'Explorer'}
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {activePersona === 'fresh' ? 'Personal' : 'Synthetic Benchmark'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 font-medium">
            Observation period: {formatDate(summary?.period_start)} → {formatDate(summary?.period_end)}
          </p>
        </div>

        {/* Period Selector & Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            value={periodDays}
            onChange={(e) => setPeriodDays(Number(e.target.value))}
            className="text-xs font-medium rounded-lg border border-[#E8E6DF] dark:border-white/[0.08] bg-white dark:bg-[#141518] px-3 py-1.5 text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400 shadow-sm cursor-pointer"
          >
            <option value={84}>Last 12 Weeks (Full Model)</option>
            <option value={30}>Last 30 Days</option>
            <option value={14}>Last 2 Weeks</option>
          </select>

          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleCsvImport}
          />
          <button
            onClick={() => csvInputRef.current?.click()}
            disabled={isImporting || activePersona !== 'fresh'}
            title={activePersona !== 'fresh' ? 'Switch to Personal workspace before importing real transactions' : 'Import a bank statement CSV'}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E8E6DF] dark:border-white/[0.08] bg-white dark:bg-[#141518] text-zinc-700 dark:text-zinc-200 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isImporting ? 'Importing…' : 'Import CSV'}</span>
          </button>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {importMessage && (
        <div className="mb-4 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50 dark:bg-sky-950/30 p-3 text-xs text-sky-800 dark:text-sky-200">
          <div>{importMessage}</div>
          <div className="mt-1 text-[11px] opacity-80">
            CSVs are processed by this app's backend. For sensitive statements, use a locally hosted instance and do not upload to a public demo deployment.
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchData}
            className="px-2.5 py-1 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Central Finding Banner */}
      {insight && (
        <div className="mb-6 p-6 sm:p-7 rounded-2xl bg-zinc-950 text-white dark:bg-[#141518] border border-zinc-800 dark:border-white/[0.08] shadow-md relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Empirical Behavioral Association</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400 font-mono">Snapshot: Sundays 23:59:59 IST</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
                {insight.headline}
              </h2>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
                {insight.status === 'sufficient' ? (
                  <>
                    Derived from {insight.total_weeks_analyzed} weeks of records. In {insight.qualifying_week_count} high-stress weeks (≥3 overdue tasks), convenience food
                    averaged <strong className="text-white font-mono">{formatINR(insight.qualifying_avg)}/wk</strong> vs{' '}
                    <strong className="text-white font-mono">{formatINR(insight.baseline_avg)}/wk</strong> during {insight.baseline_week_count} calm baseline weeks.
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
                  <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-emerald-400">
                    {insight.ratio.toFixed(1)}×
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 mt-0.5">
                    Observed Multiple
                  </div>
                </div>
              )}
              <Link
                to="/insight"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/10"
              >
                <span>Inspect Evidence &amp; Calculation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4 Metric Columns Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {/* Metric 1 */}
        <div className="p-4 rounded-xl luxury-card">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            Total Spending
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-zinc-950 dark:text-white">
            {loading ? '...' : formatINR(summary?.total_spending || 0)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Over {periodDays} days</div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-xl luxury-card">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            Convenience Food
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400">
            {loading ? '...' : formatINR(summary?.convenience_food_spending || 0)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">{cfShare}% of total period spending</div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-xl luxury-card">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            Tasks Completed
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
            {loading ? '...' : summary?.tasks_completed ?? 0}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Closed successfully</div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-xl luxury-card">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            Currently Overdue
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400">
            {loading ? '...' : summary?.tasks_overdue ?? 0}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">{summary?.tasks_upcoming ?? 0} tasks upcoming</div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Weekly Spending Trend */}
        <div className="p-5 rounded-xl luxury-card">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
              Weekly Spending Trend
            </h3>
            <p className="text-[11px] text-zinc-500">
              Total expenditure vs convenience food delivery (INR)
            </p>
          </div>

          <div className="h-60 w-full">
            {summary?.weekly_spending && summary.weekly_spending.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={summary.weekly_spending} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.12} stroke="#888888" />
                  <XAxis
                    dataKey="week_start"
                    tickFormatter={(val) => val.slice(5)}
                    tick={{ fontSize: 10, fill: '#888888' }}
                    stroke="#888888"
                    opacity={0.5}
                  />
                  <YAxis
                    tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                    tick={{ fontSize: 10, fill: '#888888' }}
                    stroke="#888888"
                    opacity={0.5}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatINR(Number(val)), '']}
                    labelFormatter={(label) => `Week of ${label}`}
                    contentStyle={{
                      backgroundColor: '#18181B',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Spending"
                    stroke="#71717A"
                    strokeWidth={1.5}
                    fill="#71717A"
                    fillOpacity={0.15}
                  />
                  <Area
                    type="monotone"
                    dataKey="convenience_food"
                    name="Convenience Food"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="#10B981"
                    fillOpacity={0.25}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                No weekly data available yet.
              </div>
            )}
          </div>
        </div>

        {/* Task Overload vs Convenience Food */}
        <div className="p-5 rounded-xl luxury-card">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
              Task Backlog vs Convenience Food
            </h3>
            <p className="text-[11px] text-zinc-500">
              Overdue count at Sunday snapshot vs food delivery spend
            </p>
          </div>

          <div className="h-60 w-full">
            {insight?.weekly_breakdown && insight.weekly_breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={insight.weekly_breakdown}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.12} stroke="#888888" />
                  <XAxis
                    dataKey="week_start"
                    tickFormatter={(val) => val.slice(5)}
                    tick={{ fontSize: 10, fill: '#888888' }}
                    stroke="#888888"
                    opacity={0.5}
                  />
                  <YAxis
                    tickFormatter={(val) => `₹${val}`}
                    tick={{ fontSize: 10, fill: '#888888' }}
                    stroke="#888888"
                    opacity={0.5}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181B',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                    formatter={(val: any, name: any) => [
                      name === 'convenience_food_spending' ? formatINR(Number(val)) : val,
                      name === 'convenience_food_spending' ? 'Food Spend' : 'Overdue Tasks',
                    ]}
                  />
                  <Bar
                    dataKey="convenience_food_spending"
                    name="Convenience Food (₹)"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
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

      {/* Recent Ledger Feed (Expenses & Tasks) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Expenses Table */}
        <div className="p-5 rounded-xl luxury-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Recent Expense Records
            </h3>
            <span className="text-[11px] text-zinc-400 font-mono">Latest 5 entries</span>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
            {recentExpenses.length > 0 ? (
              recentExpenses.map((exp) => (
                <div key={exp.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {exp.description || formatCategoryName(exp.category)}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {formatDate(exp.date)} • {formatCategoryName(exp.category)}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {formatINR(exp.amount)}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-zinc-400 text-xs">No expense records yet.</div>
            )}
          </div>
        </div>

        {/* Recent Tasks List */}
        <div className="p-5 rounded-xl luxury-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Task Backlog Snapshots
            </h3>
            <span className="text-[11px] text-zinc-400 font-mono">Status &amp; Deadlines</span>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
            {recentTasks.length > 0 ? (
              recentTasks.map((t) => (
                <div key={t.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {t.title}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Due: {formatDate(t.due_date)} • Category: {formatCategoryName(t.category)}
                    </div>
                  </div>
                  <div>
                    {t.completed_at ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        Closed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                        Open
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-zinc-400 text-xs">No task records yet.</div>
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
