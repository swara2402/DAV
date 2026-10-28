import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Clock,
  Compass,
  AlertTriangle,
} from 'lucide-react'
import { formatINR } from '../lib/utils'

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0F0F0E] text-stone-900 dark:text-stone-100 flex flex-col selection:bg-green-100 selection:text-green-900">
      {/* Navbar */}
      <header className="border-b border-stone-200/80 dark:border-stone-800/80 backdrop-blur-sm sticky top-0 z-20 bg-[#FAFAF8]/90 dark:bg-[#0F0F0E]/90">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              LD
            </div>
            <span className="font-semibold text-lg tracking-tight">Life, Decoded</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/persona"
              className="text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              Explore Demo
            </Link>
            <Link
              to="/auth"
              className="text-xs sm:text-sm font-medium px-4 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white shadow-sm transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-300 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-green-600" />
          <span>Explainable Behavioral Analytics for Young Adults</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.1] mb-6">
          Discover what your everyday routines might be costing you.
        </h1>

        <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed mb-8">
          Life, Decoded uncovers patterns between your workload stress and your convenience spending.
          No black boxes. No vague budgeting guilt. Just reproducible, evidence-based math.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            to="/persona"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-sm shadow-md transition"
          >
            Explore 60-Second Demo
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/auth"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium text-sm transition"
          >
            Start Personal Workspace
          </Link>
        </div>
      </section>

      {/* Realistic Insight Preview Card */}
      <section className="px-4 sm:px-6 max-w-3xl mx-auto w-full mb-20">
        <div className="bg-white dark:bg-[#1A1A19] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-green-500 via-emerald-600 to-green-700" />

          {/* Synthetic Banner */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] font-medium text-amber-800 dark:text-amber-300 mb-4">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Synthetic Example — Derived from Maya's 12-week simulated baseline</span>
          </div>

          <div className="flex items-start justify-between gap-4 mb-3">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
              During high-stress weeks, convenience food spending was 3.2× higher
            </h2>
            <div className="shrink-0 px-3 py-1 rounded-full bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm font-bold">
              3.2×
            </div>
          </div>

          <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-6">
            In weeks where Maya had 3 or more tasks overdue by the Sunday snapshot, convenience-food
            spending averaged <span className="font-semibold text-stone-900 dark:text-stone-100">{formatINR(1314)}/week</span> compared to <span className="font-semibold text-stone-900 dark:text-stone-100">{formatINR(411)}/week</span> in calm baseline weeks.
          </p>

          {/* Evidence Preview Metrics */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800/80 mb-6 text-center">
            <div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400">Qualifying Weeks (≥3 overdue)</div>
              <div className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5">5 weeks</div>
              <div className="text-xs text-stone-600 dark:text-stone-400 font-medium">{formatINR(1314)} avg</div>
            </div>
            <div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400">Baseline Weeks (&lt;3 overdue)</div>
              <div className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5">7 weeks</div>
              <div className="text-xs text-stone-600 dark:text-stone-400 font-medium">{formatINR(411)} avg</div>
            </div>
            <div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400">Observed Ratio</div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400 mt-0.5">3.20×</div>
              <div className="text-xs text-stone-500">Verified math</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 pt-2 border-t border-stone-100 dark:border-stone-800">
            <span>Formula: <code className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">mean(qualifying) / mean(baseline)</code></span>
            <Link to="/persona" className="text-green-600 dark:text-green-400 font-medium hover:underline">
              Inspect full calculation →
            </Link>
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-12 px-4 sm:px-6 max-w-5xl mx-auto w-full border-t border-stone-200/80 dark:border-stone-800/80">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold tracking-tight">Built on Transparency, Not Hype</h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
            Why Life, Decoded is fundamentally different from traditional budget apps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1A1A19] border border-stone-200 dark:border-stone-800 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-200 mb-4">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-base mb-2">Historical Snapshots</h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              We reconstruct task overdue status at precise Sunday closing snapshots. A task completed late is accurately recorded as overdue during its backlog weeks.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#1A1A19] border border-stone-200 dark:border-stone-800 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-200 mb-4">
              <Compass className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-base mb-2">Cautious Uncertainty</h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              We label findings as behavioral hypotheses, never proven causation. When data is insufficient (less than 3 weeks in each group), we honestly report it.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#1A1A19] border border-stone-200 dark:border-stone-800 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-200 mb-4">
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-base mb-2">Follow-up Outcomes</h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              When you try an action, we track outcomes over 4 subsequent calendar weeks. We don't claim success simply because an action button was clicked.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 dark:border-stone-800 py-8 px-4 text-center text-xs text-stone-500">
        <p className="max-w-xl mx-auto leading-relaxed">
          Life, Decoded — Open-source behavioral personal analytics. All demo data is synthetically generated for testing and demonstration purposes. Currency values displayed in INR (₹).
        </p>
      </footer>
    </div>
  )
}
