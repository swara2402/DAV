import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowRight,
  AlertTriangle,
  Plus,
} from 'lucide-react'
import type { PersonaType } from '../types'
import { useAuth } from '../contexts/AuthContext'

export const PersonaSelection: React.FC = () => {
  const { loginDemo } = useAuth()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<PersonaType>('maya')
  const [loading, setLoading] = useState<boolean>(false)

  const handleSelect = async (persona: PersonaType) => {
    setSelected(persona)
    setLoading(true)
    try {
      await loginDemo(persona)
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 flex flex-col justify-center py-16 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500/20 selection:text-emerald-950 dark:selection:text-emerald-200">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/[0.07] blur-3xl pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto w-full">
        {/* Brand Link */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm shadow-glow-emerald-sm group-hover:scale-105 transition-transform">
              LD
            </div>
            <span className="font-bold text-lg tracking-tight text-zinc-950 dark:text-white">Life, Decoded</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3 text-zinc-950 dark:text-white">
            Choose a Persona to Explore
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Select a fictional persona with a pre-seeded 12-week dataset to immediately evaluate
            the Insight Engine, or start with a clean slate.
          </p>
        </div>

        {/* Synthetic Disclosure Notice */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3.5 shadow-subtle max-w-3xl mx-auto">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Fictional Benchmark Disclosure:</strong> Maya and Arjun are synthetic personas designed to
            demonstrate mathematical correlations in routine expenses and task load. Their data is generated
            deterministically and does not represent real individuals or live banking connections.
          </p>
        </div>

        {/* Persona Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Maya */}
          <div
            onClick={() => setSelected('maya')}
            className={`p-7 rounded-3xl bg-white dark:bg-[#141416] border-2 cursor-pointer transition-all duration-200 relative flex flex-col justify-between shadow-subtle hover:shadow-premium ${
              selected === 'maya'
                ? 'border-emerald-500 ring-4 ring-emerald-500/10 dark:ring-emerald-500/20'
                : 'border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center font-extrabold text-base shadow-glow-emerald-sm">
                  M
                </div>
                <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  First Job
                </span>
              </div>
              <h3 className="font-extrabold text-xl text-zinc-950 dark:text-white mb-1">Maya, 23</h3>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3.5">
                Bangalore • Junior Software Analyst
              </p>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-5 font-normal">
                Lives independently in a rented apartment. Fixed salary with work deadlines that periodically
                pile up, driving late-night convenience food deliveries.
              </p>
              <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>Expenses:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">114 records</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tasks:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">78 records</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Calculated Ratio:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">3.20×</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={(e) => {
                e.stopPropagation()
                handleSelect('maya')
              }}
              className="mt-6 w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-bold shadow-glow-emerald-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading && selected === 'maya' ? 'Seeding Maya...' : 'Select Maya'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Arjun */}
          <div
            onClick={() => setSelected('arjun')}
            className={`p-7 rounded-3xl bg-white dark:bg-[#141416] border-2 cursor-pointer transition-all duration-200 relative flex flex-col justify-between shadow-subtle hover:shadow-premium ${
              selected === 'arjun'
                ? 'border-emerald-500 ring-4 ring-emerald-500/10 dark:ring-emerald-500/20'
                : 'border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                  A
                </div>
                <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                  Freelancer
                </span>
              </div>
              <h3 className="font-extrabold text-xl text-zinc-950 dark:text-white mb-1">Arjun, 25</h3>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3.5">
                Mumbai • Independent UI Designer
              </p>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-5 font-normal">
                Irregular client sprints and project delivery crunches. High variance in weekly task load
                correlating with meal delivery spikes.
              </p>
              <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>Expenses:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">129 records</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tasks:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">67 records</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Calculated Ratio:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">3.42×</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={(e) => {
                e.stopPropagation()
                handleSelect('arjun')
              }}
              className="mt-6 w-full py-3 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold shadow-subtle transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <span>{loading && selected === 'arjun' ? 'Seeding Arjun...' : 'Select Arjun'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Start Fresh */}
          <div
            onClick={() => setSelected('fresh')}
            className={`p-7 rounded-3xl bg-white dark:bg-[#141416] border-2 cursor-pointer transition-all duration-200 relative flex flex-col justify-between shadow-subtle hover:shadow-premium ${
              selected === 'fresh'
                ? 'border-emerald-500 ring-4 ring-emerald-500/10 dark:ring-emerald-500/20'
                : 'border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-extrabold text-base border border-zinc-200 dark:border-zinc-700">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  Clean Slate
                </span>
              </div>
              <h3 className="font-extrabold text-xl text-zinc-950 dark:text-white mb-1">Start Fresh</h3>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3.5">
                Empty Personal Workspace
              </p>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-5 font-normal">
                Start with a zeroed-out dashboard. Enter your own genuine expenses and tasks.
                The Insight Engine will calculate your ratio as data accumulates.
              </p>
              <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>Expenses:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">0 records</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tasks:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">0 records</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <span className="font-bold text-zinc-500">Awaiting records</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={(e) => {
                e.stopPropagation()
                handleSelect('fresh')
              }}
              className="mt-6 w-full py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <span>{loading && selected === 'fresh' ? 'Initializing...' : 'Start Fresh'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
