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
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-500">Calculating behavioral models from records...</p>
        </div>
      </Layout>
    )
  }

  if (error || !insight) {
    return (
      <Layout>
        <div className="p-8 rounded-2xl bg-white dark:bg-[#1A1A19] border border-stone-200 dark:border-stone-800 text-center max-w-lg mx-auto">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-semibold mb-1">Could not load insight</h2>
          <p className="text-xs text-stone-500 mb-4">{error || 'Unknown error'}</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 text-white text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
        </div>
      </Layout>
    )
  }

  // Combine and sort weekly evidence data for the evidence bar chart
  const evidenceData = insight.weekly_breakdown || []

  return (
    <Layout>
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
      </div>

      {/* Synthetic Data Disclosure Banner */}
      {insight.data_source === 'demo_synthetic' && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Synthetic Data Disclosure:</strong> This finding was derived from a version-controlled
            synthetic benchmark dataset. It illustrates the mathematical model and does not reflect a live
            bank account or an actual person's private transactions.
          </p>
        </div>
      )}

      {/* Main Insight Hero Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#1A1A19] border border-stone-200 dark:border-stone-800 shadow-sm mb-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-950/60 border border-green-200 dark:border-green-800 text-[11px] font-semibold text-green-800 dark:text-green-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Behavioral Association</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {insight.headline}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Observation window: {formatDate(insight.observation_start)} → {formatDate(insight.observation_end)} ({insight.total_weeks_analyzed} complete calendar weeks)
            </p>
          </div>

          {insight.ratio && (
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center shrink-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-green-600 dark:text-green-400">
                {insight.ratio.toFixed(2)}×
              </div>
              <div className="text-[11px] text-stone-500 font-medium mt-0.5">
                Observed Multiple
              </div>
            </div>
          )}
        </div>

        {/* Observed Group Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <div className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-800 dark:text-red-300 font-medium">
            Qualifying: {insight.qualifying_week_count} weeks (≥3 overdue tasks)
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300 font-medium">
            Baseline: {insight.baseline_week_count} weeks (&lt;3 overdue tasks)
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-900 text-xs text-stone-500">
            Snapshot convention: {insight.snapshot_convention}
          </div>
        </div>

        {/* Weekly Evidence Chart */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Weekly Evidence Distribution
              </h3>
              <p className="text-[11px] text-stone-500">
                Red bars indicate qualifying weeks (≥3 overdue tasks); Gray bars indicate baseline weeks
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evidenceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                  formatter={(val: any) => [formatINR(Number(val)), 'Convenience Food']}
                  labelFormatter={(label) => `Week of ${label}`}
                />
                {insight.qualifying_avg && (
                  <ReferenceLine
                    y={insight.qualifying_avg}
                    stroke="#EF4444"
                    strokeDasharray="4 4"
                    label={{
                      value: `Qualifying Avg: ₹${Math.round(insight.qualifying_avg)}`,
                      fill: '#EF4444',
                      fontSize: 10,
                      position: 'top',
                    }}
                  />
                )}
                {insight.baseline_avg && (
                  <ReferenceLine
                    y={insight.baseline_avg}
                    stroke="#78716C"
                    strokeDasharray="4 4"
                    label={{
                      value: `Baseline Avg: ₹${Math.round(insight.baseline_avg)}`,
                      fill: '#78716C',
                      fontSize: 10,
                      position: 'bottom',
                    }}
                  />
                )}
                <Bar dataKey="convenience_food_spending" radius={[4, 4, 0, 0]}>
                  {evidenceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.is_qualifying ? '#EF4444' : '#A8A29E'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Exact Observed Metrics Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500">
                <th className="py-2.5 font-medium">Cohort Group</th>
                <th className="py-2.5 font-medium">Definition</th>
                <th className="py-2.5 font-medium text-center">Weeks</th>
                <th className="py-2.5 font-medium text-right">Avg Weekly CF Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-medium">
              <tr>
                <td className="py-3 text-red-600 dark:text-red-400 font-semibold">
                  Qualifying Group
                </td>
                <td className="py-3 text-stone-600 dark:text-stone-300">
                  ≥ 3 tasks overdue at Sunday snapshot
                </td>
                <td className="py-3 text-center">{insight.qualifying_week_count}</td>
                <td className="py-3 text-right font-bold">
                  {formatINRPrecise(insight.qualifying_avg)}
                </td>
              </tr>
              <tr>
                <td className="py-3 text-stone-700 dark:text-stone-300">
                  Baseline Group
                </td>
                <td className="py-3 text-stone-600 dark:text-stone-300">
                  &lt; 3 tasks overdue at Sunday snapshot
                </td>
                <td className="py-3 text-center">{insight.baseline_week_count}</td>
                <td className="py-3 text-right font-bold">
                  {formatINRPrecise(insight.baseline_avg)}
                </td>
              </tr>
              <tr className="bg-stone-50 dark:bg-stone-900/40">
                <td className="py-3 font-bold text-stone-900 dark:text-stone-100" colSpan={3}>
                  Calculated Ratio (Qualifying / Baseline)
                </td>
                <td className="py-3 text-right font-extrabold text-green-600 dark:text-green-400 text-sm">
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
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1A1A19] border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200">
            <Compass className="w-4 h-4 text-green-600" />
            <h3 className="font-semibold text-sm">Cautious Possible Explanation</h3>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
            {insight.possible_explanation}
          </p>
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 text-[11px] text-stone-500 leading-relaxed">
            <strong>Important distinction:</strong> This calculation detects association over time, not proof of causation. Unmeasured factors such as work travel, illness, or project deadlines may influence both task delays and meal choices independently.
          </div>
        </div>

        {/* Practical Recommended Action & "Tried It" workflow */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1A1A19] border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <h3 className="font-semibold text-sm">Recommended Behavioral Action</h3>
            </div>
            <p className="text-xs text-stone-700 dark:text-stone-200 font-medium leading-relaxed">
              "{insight.recommended_action}"
            </p>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              When task pressure mounts, decision fatigue makes meal ordering the path of least resistance.
              Having a concrete fallback breaks this cycle.
            </p>
          </div>

          <div>
            {actionSubmitted ? (
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 space-y-2">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-300 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Action Logged in Follow-up Tracker</span>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-400">
                  {followup?.message ||
                    'Evaluating outcomes requires 4 subsequent calendar weeks. We will compare future convenience food spending with your historical baseline.'}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleTriedIt}
                disabled={submittingAction}
                className="w-full py-2.5 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submittingAction ? 'Logging Action...' : 'I Tried This Change'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expandable "How was this calculated?" Panel */}
      <div className="rounded-2xl bg-white dark:bg-[#1A1A19] border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden mb-8">
        <button
          type="button"
          onClick={() => setShowCalculation(!showCalculation)}
          className="w-full p-5 text-left flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/40 transition"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-green-600" />
            <span className="font-semibold text-sm">
              How was this calculated? (Complete Mathematical Transparency)
            </span>
          </div>
          {showCalculation ? (
            <ChevronUp className="w-4 h-4 text-stone-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-stone-400" />
          )}
        </button>

        {showCalculation && (
          <div className="p-6 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/20 space-y-6 text-xs text-stone-700 dark:text-stone-300">
            {/* Formulas & Thresholds */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 p-3 rounded-xl bg-white dark:bg-[#1A1A19] border border-stone-200 dark:border-stone-800">
                <div className="text-[11px] text-stone-500 font-medium">Mathematical Formula</div>
                <code className="text-xs font-mono text-green-700 dark:text-green-300">
                  {insight.formula}
                </code>
                <div className="text-[10px] text-stone-400">Formula Version: {insight.formula_version}</div>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl bg-white dark:bg-[#1A1A19] border border-stone-200 dark:border-stone-800">
                <div className="text-[11px] text-stone-500 font-medium">Engine Specifications</div>
                <div className="font-mono text-xs">
                  Engine Version: {insight.engine_version} • Timezone: {insight.timezone}
                </div>
                <div className="text-[10px] text-stone-400">
                  Threshold: ≥{insight.overdue_threshold} overdue tasks for qualifying cohort
                </div>
              </div>
            </div>

            {/* List of Qualifying Weeks */}
            <div>
              <h4 className="font-semibold text-xs text-stone-900 dark:text-stone-100 mb-2">
                Qualifying Weeks ({insight.qualifying_weeks.length} weeks with ≥ 3 overdue tasks)
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-[11px]">
                {insight.qualifying_weeks.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-white dark:bg-[#1A1A19] border border-stone-200 dark:border-stone-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold">{w.week_start} → {w.week_end}</span>
                      <span className="text-stone-500 ml-2">({w.overdue_count} tasks overdue at snapshot)</span>
                    </div>
                    <div className="font-bold text-red-600 dark:text-red-400">
                      {formatINRPrecise(w.convenience_food_spending)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* List of Baseline Weeks */}
            <div>
              <h4 className="font-semibold text-xs text-stone-900 dark:text-stone-100 mb-2">
                Baseline Weeks ({insight.baseline_weeks.length} weeks with &lt; 3 overdue tasks)
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-[11px]">
                {insight.baseline_weeks.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-white dark:bg-[#1A1A19] border border-stone-200 dark:border-stone-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold">{w.week_start} → {w.week_end}</span>
                      <span className="text-stone-500 ml-2">({w.overdue_count} tasks overdue at snapshot)</span>
                    </div>
                    <div className="font-bold text-stone-700 dark:text-stone-300">
                      {formatINRPrecise(w.convenience_food_spending)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Sufficiency Rules */}
            <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-[11px] text-stone-600 dark:text-stone-400 space-y-1">
              <div className="font-semibold text-stone-900 dark:text-stone-200">
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
