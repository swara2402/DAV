import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ArrowLeft,
  HelpCircle,
  CheckCircle2,
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
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-zinc-950 dark:border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Reconstructing historical snapshots...
          </p>
        </div>
      </Layout>
    )
  }

  if (error || !insight) {
    return (
      <Layout>
        <div className="p-8 rounded-2xl luxury-card text-center max-w-md mx-auto">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-bold mb-1">Could not load insight</h2>
          <p className="text-xs text-zinc-500 mb-4">{error || 'Unknown error'}</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold"
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
      <div className="mb-5">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Synthetic Data Disclosure */}
      {insight.data_source === 'demo_synthetic' && (
        <div className="mb-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Synthetic Data Disclosure:</strong> This finding was derived from a version-controlled
            synthetic benchmark dataset. It illustrates the mathematical model and does not reflect a live
            bank account or an actual person's financial transactions.
          </p>
        </div>
      )}

      {/* Main Insight Hero Card */}
      <div className="p-6 sm:p-7 rounded-2xl luxury-card mb-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              Behavioral Association
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white leading-tight">
              {insight.headline}
            </h1>
            <p className="text-xs text-zinc-500 font-medium">
              Observation window: {formatDate(insight.observation_start)} → {formatDate(insight.observation_end)} ({insight.total_weeks_analyzed} complete calendar weeks)
            </p>
          </div>

          {insight.ratio && (
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-center shrink-0">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                {insight.ratio.toFixed(2)}×
              </div>
              <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mt-0.5">
                Observed Multiple
              </div>
            </div>
          )}
        </div>

        {/* Observed Group Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 font-semibold font-mono">
            Qualifying: {insight.qualifying_week_count} weeks (≥3 overdue tasks)
          </div>
          <div className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 font-semibold font-mono">
            Baseline: {insight.baseline_week_count} weeks (&lt;3 overdue tasks)
          </div>
          <div className="px-3 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-500 font-mono">
            Snapshot: {insight.snapshot_convention}
          </div>
        </div>

        {/* Weekly Evidence Chart */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Weekly Evidence Distribution
            </h3>
            <p className="text-[11px] text-zinc-400">
              Crimson bars indicate qualifying weeks (≥3 overdue tasks); Slate bars indicate baseline weeks
            </p>
          </div>

          <div className="h-68 w-full pt-1">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={evidenceData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
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
                  formatter={(val: any) => [formatINR(Number(val)), 'Food Spend']}
                  labelFormatter={(label) => `Week of ${label}`}
                />
                {insight.qualifying_avg && (
                  <ReferenceLine
                    y={insight.qualifying_avg}
                    stroke="#F43F5E"
                    strokeDasharray="4 4"
                    label={{
                      value: `Qualifying Avg: ₹${Math.round(insight.qualifying_avg)}`,
                      fill: '#F43F5E',
                      fontSize: 10,
                      position: 'top',
                    }}
                  />
                )}
                {insight.baseline_avg && (
                  <ReferenceLine
                    y={insight.baseline_avg}
                    stroke="#71717A"
                    strokeDasharray="4 4"
                    label={{
                      value: `Baseline Avg: ₹${Math.round(insight.baseline_avg)}`,
                      fill: '#71717A',
                      fontSize: 10,
                      position: 'bottom',
                    }}
                  />
                )}
                <Bar dataKey="convenience_food_spending" radius={[4, 4, 0, 0]}>
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
        <div className="overflow-x-auto pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                <th className="py-2.5 font-semibold uppercase tracking-wider text-[10px]">Cohort Group</th>
                <th className="py-2.5 font-semibold uppercase tracking-wider text-[10px]">Definition</th>
                <th className="py-2.5 font-semibold uppercase tracking-wider text-[10px] text-center">Weeks</th>
                <th className="py-2.5 font-semibold uppercase tracking-wider text-[10px] text-right">Avg CF Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium">
              <tr>
                <td className="py-3 text-rose-600 dark:text-rose-400 font-bold">
                  Qualifying Group
                </td>
                <td className="py-3 text-zinc-600 dark:text-zinc-400">
                  ≥ 3 tasks overdue at Sunday snapshot
                </td>
                <td className="py-3 text-center font-mono">{insight.qualifying_week_count}</td>
                <td className="py-3 text-right font-mono font-bold">
                  {formatINRPrecise(insight.qualifying_avg)}
                </td>
              </tr>
              <tr>
                <td className="py-3 text-zinc-700 dark:text-zinc-300 font-bold">
                  Baseline Group
                </td>
                <td className="py-3 text-zinc-600 dark:text-zinc-400">
                  &lt; 3 tasks overdue at Sunday snapshot
                </td>
                <td className="py-3 text-center font-mono">{insight.baseline_week_count}</td>
                <td className="py-3 text-right font-mono font-bold">
                  {formatINRPrecise(insight.baseline_avg)}
                </td>
              </tr>
              <tr className="bg-zinc-50 dark:bg-zinc-900/40">
                <td className="py-3 font-bold text-zinc-950 dark:text-white" colSpan={3}>
                  Calculated Multiplier (Qualifying / Baseline)
                </td>
                <td className="py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {insight.ratio ? `${insight.ratio.toFixed(2)}×` : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Cautious Explanation & Recommended Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Possible Explanation */}
        <div className="p-6 rounded-2xl luxury-card space-y-3">
          <h3 className="font-bold text-sm text-zinc-950 dark:text-white">Cautious Possible Explanation</h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {insight.possible_explanation}
          </p>
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 text-[11px] text-zinc-500 leading-relaxed">
            <strong>Statistical distinction:</strong> This calculation detects association over time, not proof of causation. Unmeasured factors such as work travel, illness, or project deadlines may influence both task delays and meal choices independently.
          </div>
        </div>

        {/* Practical Recommended Action */}
        <div className="p-6 rounded-2xl luxury-card flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <h3 className="font-bold text-sm text-zinc-950 dark:text-white">Recommended Behavioral Action</h3>
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs font-medium text-zinc-800 dark:text-zinc-200">
              "{insight.recommended_action}"
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              When task pressure mounts, decision fatigue makes meal ordering the path of least resistance. Having a concrete fallback breaks this cycle.
            </p>
          </div>

          <div>
            {actionSubmitted ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Action Logged in Follow-up Tracker</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono">
                  {followup?.message ||
                    'Evaluating outcomes requires 4 subsequent calendar weeks. We will compare future convenience food spending with your historical baseline.'}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleTriedIt}
                disabled={submittingAction}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                <span>{submittingAction ? 'Logging Action...' : 'I Tried This Change'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Mathematical Transparency Panel */}
      <div className="rounded-2xl luxury-card overflow-hidden mb-8">
        <button
          type="button"
          onClick={() => setShowCalculation(!showCalculation)}
          className="w-full p-5 text-left flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-zinc-500" />
            <span className="font-semibold text-xs sm:text-sm text-zinc-950 dark:text-white">
              How was this calculated? (Complete Mathematical Transparency)
            </span>
          </div>
          {showCalculation ? (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </button>

        {showCalculation && (
          <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 space-y-5 text-xs text-zinc-700 dark:text-zinc-300">
            {/* Formulas & Thresholds */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 p-3.5 rounded-xl bg-white dark:bg-[#141518] border border-zinc-200/70 dark:border-zinc-800">
                <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Formula</div>
                <code className="text-xs font-mono text-emerald-600 dark:text-emerald-400 block">
                  {insight.formula}
                </code>
                <div className="text-[10px] text-zinc-400 font-mono">Version: {insight.formula_version}</div>
              </div>

              <div className="space-y-1.5 p-3.5 rounded-xl bg-white dark:bg-[#141518] border border-zinc-200/70 dark:border-zinc-800">
                <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Engine Specs</div>
                <div className="font-mono text-xs">
                  Engine Version: {insight.engine_version} • Timezone: {insight.timezone}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono">
                  Threshold: ≥{insight.overdue_threshold} overdue tasks for qualifying cohort
                </div>
              </div>
            </div>

            {/* List of Qualifying Weeks */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-500 mb-2">
                Qualifying Weeks ({insight.qualifying_weeks.length} weeks with ≥ 3 overdue tasks)
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-[11px]">
                {insight.qualifying_weeks.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-white dark:bg-[#141518] border border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold">{w.week_start} → {w.week_end}</span>
                      <span className="text-rose-600 dark:text-rose-400 ml-2 font-medium">({w.overdue_count} overdue at snapshot)</span>
                    </div>
                    <div className="font-bold text-rose-600 dark:text-rose-400">
                      {formatINRPrecise(w.convenience_food_spending)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* List of Baseline Weeks */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-500 mb-2">
                Baseline Weeks ({insight.baseline_weeks.length} weeks with &lt; 3 overdue tasks)
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-[11px]">
                {insight.baseline_weeks.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-white dark:bg-[#141518] border border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold">{w.week_start} → {w.week_end}</span>
                      <span className="text-zinc-500 ml-2">({w.overdue_count} overdue at snapshot)</span>
                    </div>
                    <div className="font-bold text-zinc-700 dark:text-zinc-300">
                      {formatINRPrecise(w.convenience_food_spending)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sufficiency Rules */}
            <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1">
              <div className="font-bold text-zinc-900 dark:text-zinc-200">
                Minimum Statistical Sufficiency Requirements
              </div>
              <div>• At least {insight.min_qualifying_weeks_required} qualifying weeks required (Observed: {insight.qualifying_week_count})</div>
              <div>• At least {insight.min_baseline_weeks_required} baseline weeks required (Observed: {insight.baseline_week_count})</div>
              <div>• Baseline convenience-food spending average must be strictly positive to avoid division by zero.</div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
