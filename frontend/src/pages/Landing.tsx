import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  Compass,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { formatINR } from '../lib/utils'

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 flex flex-col relative overflow-hidden selection:bg-emerald-500/20 selection:text-emerald-950 dark:selection:text-emerald-200">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[35%] right-[-10%] w-[500px] h-[400px] bg-emerald-500/[0.04] blur-[120px] pointer-events-none -z-10" />

      {/* Navbar */}
      <header className="border-b border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl sticky top-0 z-30 bg-[#FBFBFA]/80 dark:bg-[#09090B]/80 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm shadow-glow-emerald-sm group-hover:scale-105 transition-transform duration-200">
              LD
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight leading-none text-zinc-900 dark:text-zinc-50">
                Life, Decoded
              </span>
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 tracking-wider uppercase mt-0.5">
                Behavioral Analytics
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              to="/persona"
              className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-all duration-150"
            >
              Explore Demo
            </Link>
            <Link
              to="/auth"
              className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white shadow-sm hover:shadow-glow-emerald-sm transition-all duration-200 flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 max-w-4xl mx-auto text-center relative">
        {/* Shimmer Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel text-xs text-zinc-700 dark:text-zinc-300 mb-8 shadow-subtle hover:border-emerald-500/40 transition-colors">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium tracking-tight">Explainable Behavioral Engine v1.0</span>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Zero Black Boxes</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6 text-zinc-950 dark:text-white">
          Discover what your{' '}
          <span className="font-serif italic font-normal text-emerald-600 dark:text-emerald-400 px-1 underline decoration-emerald-500/30 decoration-wavy decoration-1 underline-offset-8">
            everyday routines
          </span>{' '}
          might be costing you.
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
          Life, Decoded mathematically correlates workload backlog spikes with convenience food spending.
          No budgeting shame. No opaque AI predictions. Just transparent, verifiable evidence.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
          <Link
            to="/persona"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-semibold text-sm shadow-glow-emerald-sm transition-all duration-200 group"
          >
            <span>Explore 60-Second Demo</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            to="/auth"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl glass-panel hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-sm transition-all duration-150"
          >
            Start Fresh Workspace
          </Link>
        </div>

        {/* Micro Credibility Indicators */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Deterministic Math</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Sunday Snapshots</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Honest Sample Rules</span>
          </div>
        </div>
      </section>

      {/* Realistic Insight Preview Card */}
      <section className="px-4 sm:px-6 max-w-3xl mx-auto w-full mb-24">
        <div className="relative rounded-3xl p-1 bg-gradient-to-b from-emerald-500/30 via-zinc-200/50 to-zinc-200 dark:from-emerald-500/20 dark:via-zinc-800/40 dark:to-zinc-800/20 shadow-premium">
          <div className="rounded-[22px] bg-white dark:bg-[#141416] p-6 sm:p-9 relative overflow-hidden backdrop-blur-sm">
            {/* Ambient accent inside card */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

            {/* Synthetic Banner */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-semibold text-amber-800 dark:text-amber-300 mb-5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Synthetic Benchmark • Maya's 12-Week Independent Baseline</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-snug">
                During high-stress weeks, convenience food spending was{' '}
                <span className="text-emerald-600 dark:text-emerald-400">3.2× higher</span>
              </h2>
              <div className="shrink-0 px-3.5 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-base font-extrabold font-mono tracking-tight self-start sm:self-auto shadow-sm">
                3.20×
              </div>
            </div>

            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6 font-normal">
              In weeks where Maya had 3 or more tasks overdue at the Sunday snapshot, convenience-food
              spending averaged <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">{formatINR(1314)}/week</span> compared to <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">{formatINR(411)}/week</span> in calm baseline weeks.
            </p>

            {/* Evidence Preview Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 mb-6">
              <div className="p-3 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200/60 dark:border-zinc-800/60 text-left">
                <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Qualifying Weeks (≥3 overdue)</div>
                <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">5 weeks</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 font-mono mt-0.5">{formatINR(1314)} avg</div>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200/60 dark:border-zinc-800/60 text-left">
                <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Baseline Weeks (&lt;3 overdue)</div>
                <div className="text-xl font-bold font-mono text-zinc-800 dark:text-zinc-200 mt-1">7 weeks</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 font-mono mt-0.5">{formatINR(411)} avg</div>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200/60 dark:border-zinc-800/60 text-left">
                <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Computed Multiplier</div>
                <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">3.20×</div>
                <div className="text-xs text-emerald-600/80 font-medium mt-0.5">Statistically sufficient</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 gap-3">
              <span className="font-mono text-[11px]">Formula: ratio = mean(qualifying) / mean(baseline)</span>
              <Link
                to="/persona"
                className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              >
                <span>Inspect full mathematical audit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full border-t border-zinc-200/80 dark:border-zinc-800/80">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3">
            Core Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Built on Transparency, Not Hype</h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-2">
            Why Life, Decoded is fundamentally distinct from typical finance apps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 rounded-3xl bg-white dark:bg-[#141416] border border-zinc-200/80 dark:border-zinc-800/80 shadow-subtle hover:border-emerald-500/30 transition-all duration-200 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5 group-hover:scale-105 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-zinc-950 dark:text-white">Historical Sunday Snapshots</h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
              We reconstruct task overdue status at precise Sunday closing snapshots (23:59:59 IST). A task completed days later is accurately recognized as overdue during its backlog week.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-white dark:bg-[#141416] border border-zinc-200/80 dark:border-zinc-800/80 shadow-subtle hover:border-emerald-500/30 transition-all duration-200 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-zinc-950 dark:text-white">Cautious Behavioral Hypotheses</h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
              We present findings as behavioral hypotheses based on observation, never causal certainty. When data has fewer than 3 qualifying or baseline weeks, we honestly state "insufficient data".
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-white dark:bg-[#141416] border border-zinc-200/80 dark:border-zinc-800/80 shadow-subtle hover:border-emerald-500/30 transition-all duration-200 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-zinc-950 dark:text-white">28-Day Outcome Tracking</h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
              When you commit to a suggested behavioral change, we require 4 subsequent calendar weeks of records before evaluating differences against your baseline. No false victories.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-200/80 dark:border-zinc-800/80 py-10 px-4 text-center text-xs text-zinc-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
              LD
            </div>
            <span className="font-bold text-zinc-800 dark:text-zinc-200">Life, Decoded</span>
            <span className="text-zinc-400">• Explainable Personal Analytics</span>
          </div>
          <p className="text-zinc-500 font-mono text-[11px]">
            Synthetic benchmarks for demonstration • Currency in INR (₹) • IST timezone
          </p>
        </div>
      </footer>
    </div>
  )
}
