import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Compass,
  ArrowLeft,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts'
import { Layout } from '../components/Layout'
import { getInsight, createAction, getFollowup } from '../lib/api'
import type { InsightData, FollowupOutcome } from '../types'
import { formatINR, formatINRPrecise, formatDate } from '../lib/utils'

export const InsightDetail: React.FC = () => {
  const [insight, setInsight] = useState<InsightData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Expandable "How was this calculated?"
  const [showCalculation, setShowCalculation] = useState<boolean>(false)

  // Action / Follow-up state
  const [actionSubmitted, setActionSubmitted] = useState<boolean>(false)
  const [submittingAction, setSubmittingAction] = useState<boolean>(false)
  const [followup, setFollowup] = useState<FollowupOutcome | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await getInsight()
        setInsight(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load insight details.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleTriedIt = async () => {
    if (!insight) return
    setSubmittingAction(true)
    try {
      const act = await createAction({
        insight_id: insight.insight_type,
        action_text: insight.recommended_action,
      })
      setActionSubmitted(true)
      // Check follow-up status
      const fo = await getFollowup(act.id)
      setFollowup(fo)
    } catch (err: any) {
      console.error(err)
    } finally {
      setSubmittingAction(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="py-24 text-center space-y-4 animate-pulse">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-zinc-500 tracking-wide uppercase">
            Calculating behavioral models from records...
          </p>
        </div>
      </Layout>
    )
  }

  if (error || !insight) {
    return (
      <Layout>
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#141416] border border-zinc-200 dark:border-zinc-800 text-center max-w-lg mx-auto shadow-premium">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-1">Could not load insight</h2>
          <p className="text-xs text-zinc-500 mb-5">{error || 'Unknown error'}</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Dashboard
          </Link>
        </div>
      </Layout>
    )
  }

  const evidenceData = insight.weekly_breakdown || []

  return (
    <Layout>
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Synthetic Data Disclosure Banner */}
      {insight.data_source === 'demo_synthetic' && (
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3.5 shadow-subtle">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-normal">
            <strong>Synthetic Data Disclosure:</strong> This finding was calculated from a version-controlled
            synthetic benchmark dataset. It illustrates the mathematical model and does not reflect a live
            bank account or an actual person's financial transactions.
          </p>
        </div>
      )}

      {/* Main Insight Hero Card */}
      <div className="p-6 sm:p-9 rounded-3xl bg-white dark:bg-[#141416] border border-zinc-200/80 dark:border-zinc-800/80 shadow-premium mb-8 space-y-7 relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 relative">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Behavioral Association</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-tight">
              {insight.headline}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
              Observation window: <span className="font-mono text-zinc-800 dark:text-zinc-200">{formatDate(insight.observation_start)}</span> →{' '}
              <span className="font-mono text-zinc-800 dark:text-zinc-200">{formatDate(insight.observation_end)}</span> ({insight.total_weeks_analyzed} complete calendar weeks)
            </p>
          </div>

          {insight.ratio && (
            <div className="p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 text-center shrink-0 shadow-subtle">
              <div className="text-4xl sm:text-5xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                {insight.ratio.toFixed(2)}×
              </div>
              <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mt-1">
                Observed Multiple
              </div>
            </div>
          )}
        </div>

        {/* Observed Group Chips */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <div className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 font-semibold font-mono">
            Qualifying: {insight.qualifying_week_count} weeks (≥3 overdue tasks)
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 font-semibold font-mono">
            Baseline: {insight.baseline_week_count} weeks (&lt;3 overdue tasks)
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-500 font-mono">
            Snapshot convention: {insight.snapshot_convention}
          </div>
        </div>

        {/* Weekly Evidence Chart */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                Weekly Evidence Distribution
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Crimson bars indicate qualifying weeks (≥3 overdue tasks); Slate bars indicate baseline weeks
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evidenceData} margin={{ top: 15, right: 15, left: -15, bottom: 0 }}>
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
                  formatter={(val: any) => [formatINR(Number(val)), 'Convenience Food Spend']}
                  labelFormatter={(label) => `Week of ${label}`}
                />
                {insight.qualifying_avg && (
                  <ReferenceLine
                    y={insight.qualifying_avg}
                    stroke="#F43F5E"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Qualifying Avg: ₹${Math.round(insight.qualifying_avg)}`,
                      fill: '#F43F5E',
                      fontSize: 10,
                      fontWeight: 700,
                      position: 'top',
                      fontFamily: 'JetBrains Mono',
                    }}
                  />
                )}
                {insight.baseline_avg && (
                  <ReferenceLine
                    y={insight.baseline_avg}
                    stroke="#71717A"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Baseline Avg: ₹${Math.round(insight.baseline_avg)}`,
                      fill: '#71717A',
                      fontSize: 10,
                      fontWeight: 700,
                      position: 'bottom',
                      fontFamily: 'JetBrains Mono',
                    }}
                  />
                )}
                <Bar dataKey="convenience_food_spending" radius={[6, 6, 0, 0]}>
                  {evidenceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.is_qualifying ? '#F43F5E' : '#71717A'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Exact Observed Metrics Table */}
        <div className="overflow-x-auto pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                <th className="py-3 font-semibold uppercase tracking-wider text-[10px]">Cohort Group</th>
                <th className="py-3 font-semibold uppercase tracking-wider text-[10px]">Definition</th>
                <th className="py-3 font-semibold uppercase tracking-wider text-[10px] text-center">Weeks</th>
                <th className="py-3 font-semibold uppercase tracking-wider text-[10px] text-right">Avg CF Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
              <tr>
                <td className="py-3.5 text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>Qualifying Group</span>
                </td>
                <td className="py-3.5 text-zinc-600 dark:text-zinc-400">
                  ≥ 3 tasks overdue at Sunday closing snapshot
                </td>
                <td className="py-3.5 text-center font-mono font-bold">{insight.qualifying_week_count}</td>
                <td className="py-3.5 text-right font-mono font-bold text-sm">
                  {formatINRPrecise(insight.qualifying_avg)}
                </td>
              </tr>
              <tr>
                <td className="py-3.5 text-zinc-700 dark:text-zinc-300 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                  <span>Baseline Group</span>
                </td>
                <td className="py-3.5 text-zinc-600 dark:text-zinc-400">
                  &lt; 3 tasks overdue at Sunday closing snapshot
                </td>
                <td className="py-3.5 text-center font-mono font-bold">{insight.baseline_week_count}</td>
                <td className="py-3.5 text-right font-mono font-bold text-sm">
                  {formatINRPrecise(insight.baseline_avg)}
                </td>
              </tr>
              <tr className="bg-emerald-500/5 dark:bg-emerald-500/10">
                <td className="py-4 font-extrabold text-zinc-950 dark:text-white" colSpan={3}>
                  Calculated Multiplier (Qualifying Mean / Baseline Mean)
                </td>
                <td className="py-4 text-right font-extrabold font-mono text-emerald-600 dark:text-emerald-400 text-base">
                  {insight.ratio ? `${insight.ratio.toFixed(2)}×` : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Cautious Explanation & Recommended Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Possible Explanation */}
        <div className="p-7 rounded-3xl bg-white dark:bg-[#141416] border border-zinc-200/80 dark:border-zinc-800/80 shadow-subtle space-y-4">
          <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm">Cautious Behavioral Explanation</h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
            {insight.possible_explanation}
          </p>
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-500 leading-relaxed space-y-1">
            <div className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />
              <span>Statistical Distinction</span>
            </div>
            <p>
              This calculation detects statistical correlation over time, not proof of causation. Unmeasured factors such as project crunch weeks, health, or travel may influence both task delays and meal choices independently.
            </p>
          </div>
        </div>

        {/* Practical Recommended Action & "Tried It" workflow */}
        <div className="p-7 rounded-3xl bg-white dark:bg-[#141416] border border-zinc-200/80 dark:border-zinc-800/80 shadow-subtle flex flex-col justify-between space-y-5">
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm">Recommended Behavioral Action</h3>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 font-semibold leading-relaxed">
              "{insight.recommended_action}"
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              When workload backlog mounts, cognitive fatigue makes convenience ordering the lowest-friction option. Having a predefined fallback disrupts this automatic behavioral trigger.
            </p>
          </div>

          <div>
            {actionSubmitted ? (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Action Logged in Follow-up Tracker</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono">
                  {followup?.message ||
                    'Evaluating outcomes requires 4 subsequent calendar weeks. We will compare future convenience food spending with your historical baseline.'}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleTriedIt}
                disabled={submittingAction}
                className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs shadow-glow-emerald-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submittingAction ? 'Logging Action in Database...' : 'I Tried This Change'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expandable "How was this calculated?" Panel */}
      <div className="rounded-3xl bg-white dark:bg-[#141416] border border-zinc-200/80 dark:border-zinc-800/80 shadow-subtle overflow-hidden mb-10">
        <button
          type="button"
          onClick={() => setShowCalculation(!showCalculation)}
          className="w-full p-6 text-left flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm block text-zinc-950 dark:text-white">
                How was this calculated? (Complete Mathematical Transparency)
              </span>
              <span className="text-xs text-zinc-500">
                Inspect formulas, thresholds, Sunday snapshots, and underlying data points
              </span>
            </div>
          </div>
          {showCalculation ? (
            <ChevronUp className="w-5 h-5 text-zinc-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-400" />
          )}
        </button>

        {showCalculation && (
          <div className="p-7 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/20 space-y-6 text-xs text-zinc-700 dark:text-zinc-300">
            {/* Formulas & Thresholds */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-zinc-200/70 dark:border-zinc-800/70 shadow-subtle">
                <div className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Mathematical Formula</div>
                <code className="text-xs font-mono text-emerald-600 dark:text-emerald-400 block bg-emerald-500/5 p-2 rounded-lg">
                  {insight.formula}
                </code>
                <div className="text-[11px] text-zinc-400 font-mono">Formula Version: {insight.formula_version}</div>
              </div>

              <div className="space-y-2 p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-zinc-200/70 dark:border-zinc-800/70 shadow-subtle">
                <div className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Engine Specifications</div>
                <div className="font-mono text-xs text-zinc-800 dark:text-zinc-200">
                  Engine Version: {insight.engine_version} • Timezone: {insight.timezone}
                </div>
                <div className="text-[11px] text-zinc-500 font-mono">
                  Threshold: ≥{insight.overdue_threshold} overdue tasks for qualifying cohort
                </div>
              </div>
            </div>

            {/* List of Qualifying Weeks */}
            <div>
              <h4 className="font-bold text-xs text-zinc-950 dark:text-white uppercase tracking-wider mb-3">
                Qualifying Weeks ({insight.qualifying_weeks.length} weeks with ≥ 3 overdue tasks)
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto font-mono text-[11px]">
                {insight.qualifying_weeks.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200/70 dark:border-zinc-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-subtle"
                  >
                    <div>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{w.week_start} → {w.week_end}</span>
                      <span className="text-rose-600 dark:text-rose-400 ml-2 font-semibold">({w.overdue_count} overdue at Sunday snapshot)</span>
                      {w.overdue_task_titles && w.overdue_task_titles.length > 0 && (
                        <div className="text-[10px] text-zinc-400 font-sans mt-0.5">
                          Tasks: {w.overdue_task_titles.join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                      {formatINRPrecise(w.convenience_food_spending)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* List of Baseline Weeks */}
            <div>
              <h4 className="font-bold text-xs text-zinc-950 dark:text-white uppercase tracking-wider mb-3">
                Baseline Weeks ({insight.baseline_weeks.length} weeks with &lt; 3 overdue tasks)
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto font-mono text-[11px]">
                {insight.baseline_weeks.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200/70 dark:border-zinc-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-subtle"
                  >
                    <div>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{w.week_start} → {w.week_end}</span>
                      <span className="text-zinc-500 ml-2 font-medium">({w.overdue_count} overdue at Sunday snapshot)</span>
                    </div>
                    <div className="font-bold text-zinc-700 dark:text-zinc-300 text-sm">
                      {formatINRPrecise(w.convenience_food_spending)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Sufficiency Rules */}
            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/70 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 font-normal">
              <div className="font-bold text-zinc-950 dark:text-white">
                Minimum Statistical Sufficiency Requirements
              </div>
              <div>• At least {insight.min_qualifying_weeks_required} qualifying weeks required (Observed: {insight.qualifying_week_count})</div>
              <div>• At least {insight.min_baseline_weeks_required} baseline weeks required (Observed: {insight.baseline_week_count})</div>
              <div>• Baseline convenience-food spending average must be strictly positive to prevent division by zero.</div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
