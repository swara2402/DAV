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
    <div className="min-h-screen bg-[#F6F5F2] dark:bg-[#0C0D0E] text-zinc-900 dark:text-zinc-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs flex items-center justify-center">
              LD
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-950 dark:text-white">Life, Decoded</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-zinc-950 dark:text-white">
            Choose a Persona to Explore
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
            Select a fictional benchmark persona with a pre-seeded 12-week dataset, or initialize an empty personal workspace.
          </p>
        </div>

        {/* Fictional Benchmark Notice */}
        <div className="mb-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5 max-w-2xl mx-auto">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Fictional Persona Disclosure:</strong> Maya and Arjun are synthetic personas created to
            demonstrate mathematical correlations in routine expenses and task load. Their data does not represent real individuals or live banking connections.
          </p>
        </div>

        {/* Persona Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Maya */}
          <div
            onClick={() => setSelected('maya')}
            className={`p-5 rounded-xl luxury-card luxury-card-hover cursor-pointer flex flex-col justify-between ${
              selected === 'maya'
                ? 'ring-2 ring-zinc-950 dark:ring-white border-transparent'
                : ''
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center font-bold text-xs">
                  M
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  First Job
                </span>
              </div>
              <h3 className="font-bold text-base text-zinc-950 dark:text-white mb-0.5">Maya, 23</h3>
              <p className="text-[11px] font-medium text-zinc-500 mb-2.5">
                Bangalore • Junior Software Analyst
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                Lives independently. Work deadlines periodically pile up, driving late-night convenience food deliveries.
              </p>
              <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 space-y-1">
                <div className="flex justify-between">
                  <span>Expenses:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">114 records</span>
                </div>
                <div className="flex justify-between">
                  <span>Tasks:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">78 records</span>
                </div>
                <div className="flex justify-between">
                  <span>Ratio:</span>
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
              className="mt-4 w-full py-2 px-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{loading && selected === 'maya' ? 'Seeding...' : 'Select Maya'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Arjun */}
          <div
            onClick={() => setSelected('arjun')}
            className={`p-5 rounded-xl luxury-card luxury-card-hover cursor-pointer flex flex-col justify-between ${
              selected === 'arjun'
                ? 'ring-2 ring-zinc-950 dark:ring-white border-transparent'
                : ''
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center font-bold text-xs">
                  A
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  Freelancer
                </span>
              </div>
              <h3 className="font-bold text-base text-zinc-950 dark:text-white mb-0.5">Arjun, 25</h3>
              <p className="text-[11px] font-medium text-zinc-500 mb-2.5">
                Mumbai • Independent UI Designer
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                Irregular sprints and delivery crunches. High task variance correlating with takeout orders.
              </p>
              <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 space-y-1">
                <div className="flex justify-between">
                  <span>Expenses:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">129 records</span>
                </div>
                <div className="flex justify-between">
                  <span>Tasks:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">67 records</span>
                </div>
                <div className="flex justify-between">
                  <span>Ratio:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">3.42×</span>
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
              className="mt-4 w-full py-2 px-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{loading && selected === 'arjun' ? 'Seeding...' : 'Select Arjun'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Start Fresh */}
          <div
            onClick={() => setSelected('fresh')}
            className={`p-5 rounded-xl luxury-card luxury-card-hover cursor-pointer flex flex-col justify-between ${
              selected === 'fresh'
                ? 'ring-2 ring-zinc-950 dark:ring-white border-transparent'
                : ''
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs border border-zinc-200 dark:border-zinc-700">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  Clean Slate
                </span>
              </div>
              <h3 className="font-bold text-base text-zinc-950 dark:text-white mb-0.5">Start Fresh</h3>
              <p className="text-[11px] font-medium text-zinc-500 mb-2.5">
                Empty Personal Workspace
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                Start with a zeroed-out dashboard. Enter your own genuine records and evaluate models over time.
              </p>
              <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 space-y-1">
                <div className="flex justify-between">
                  <span>Expenses:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">0 records</span>
                </div>
                <div className="flex justify-between">
                  <span>Tasks:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">0 records</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-bold text-zinc-400">Empty workspace</span>
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
              className="mt-4 w-full py-2 px-3 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
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
