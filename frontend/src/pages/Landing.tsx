import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  Compass,
  AlertTriangle,
} from 'lucide-react'
import { formatINR } from '../lib/utils'

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F6F5F2] dark:bg-[#0C0D0E] text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-emerald-500/20">
      {/* Top Bar */}
      <header className="border-b border-[#E8E6DF] dark:border-white/[0.08] bg-[#F6F5F2]/80 dark:bg-[#0C0D0E]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs flex items-center justify-center">
              LD
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-950 dark:text-white">
              Life, Decoded
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/persona"
              className="text-xs font-medium px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition"
            >
              Explore Demo
            </Link>
            <Link
              to="/auth"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 shadow-sm transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 sm:pt-28 pb-14 sm:pb-20 px-4 sm:px-6 max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E8E6DF] dark:border-white/[0.08] bg-white dark:bg-[#141518] text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-6 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Explainable Routine Analytics</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.12] mb-5 text-zinc-950 dark:text-white">
          Discover what your everyday routines might be costing you.
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed mb-8">
          Life, Decoded uncovers empirical relationships between task overload and convenience food spending.
          Transparent, reproducible math calculated from individual records.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-xs mx-auto">
          <Link
            to="/persona"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-xs shadow-sm transition"
          >
            <span>Explore 60-Second Demo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/auth"
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-xs transition"
          >
            Start Fresh
          </Link>
        </div>
      </section>

      {/* Realistic Insight Preview Card */}
      <section className="px-4 sm:px-6 max-w-3xl mx-auto w-full mb-20">
        <div className="rounded-2xl luxury-card p-6 sm:p-7 relative overflow-hidden">
          {/* Synthetic Banner */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-[11px] font-semibold text-amber-800 dark:text-amber-300 mb-4">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Synthetic Example • Derived from Maya's 12-week simulated baseline</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-950 dark:text-white leading-snug">
              During high-stress weeks, convenience food spending was 3.2× higher
            </h2>
            <div className="shrink-0 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm font-mono font-bold">
              3.20×
            </div>
          </div>

          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-5">
            In weeks where Maya had 3 or more tasks overdue by the Sunday snapshot, convenience-food
            spending averaged <strong className="text-zinc-950 dark:text-white font-mono">{formatINR(1314)}/week</strong> compared to <strong className="text-zinc-950 dark:text-white font-mono">{formatINR(411)}/week</strong> in calm baseline weeks.
          </p>

          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-center mb-4">
            <div>
              <div className="text-[10px] uppercase font-bold text-zinc-400">Qualifying (≥3 overdue)</div>
              <div className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">5 weeks</div>
              <div className="text-[11px] font-mono text-zinc-500">{formatINR(1314)} avg</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-zinc-400">Baseline (&lt;3 overdue)</div>
              <div className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">7 weeks</div>
              <div className="text-[11px] font-mono text-zinc-500">{formatINR(411)} avg</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-zinc-400">Observed Multiple</div>
              <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">3.20×</div>
              <div className="text-[11px] text-zinc-500">Verified math</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <span className="font-mono text-[11px]">Formula: mean(qualifying) / mean(baseline)</span>
            <Link to="/persona" className="text-zinc-950 dark:text-white font-semibold hover:underline">
              Inspect full calculation →
            </Link>
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-12 px-4 sm:px-6 max-w-4xl mx-auto w-full border-t border-[#E8E6DF] dark:border-white/[0.08]">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold tracking-tight">Built on Mathematical Transparency</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Why Life, Decoded is fundamentally distinct from budgeting dashboards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl luxury-card">
            <Clock className="w-4 h-4 text-zinc-700 dark:text-zinc-300 mb-3" />
            <h3 className="font-bold text-xs mb-1">Sunday Snapshots</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              We reconstruct task overdue status at precise Sunday closing snapshots. A task completed late is accurately recorded as overdue during its backlog week.
            </p>
          </div>

          <div className="p-5 rounded-xl luxury-card">
            <Compass className="w-4 h-4 text-zinc-700 dark:text-zinc-300 mb-3" />
            <h3 className="font-bold text-xs mb-1">Cautious Hypotheses</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Findings represent behavioral hypotheses based on correlation, never causal certainty. When data is insufficient, we honestly state it.
            </p>
          </div>

          <div className="p-5 rounded-xl luxury-card">
            <ShieldCheck className="w-4 h-4 text-zinc-700 dark:text-zinc-300 mb-3" />
            <h3 className="font-bold text-xs mb-1">28-Day Outcome Tracking</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              When an action is logged, we track subsequent records over 4 calendar weeks before evaluating differences. No false claims of instant change.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#E8E6DF] dark:border-white/[0.08] py-6 px-4 text-center text-xs text-zinc-500">
        <p className="max-w-xl mx-auto leading-relaxed">
          Life, Decoded — Behavioral personal analytics. All demo data is synthetically generated for demonstration. Currency displayed in INR (₹).
        </p>
      </footer>
    </div>
  )
}
