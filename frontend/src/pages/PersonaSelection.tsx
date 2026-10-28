import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  ArrowRight,
  AlertTriangle,
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
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0F0F0E] text-stone-900 dark:text-stone-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-300 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-green-600" />
            <span>Select Your Exploration Mode</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Choose a Persona to Explore
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-300 max-w-xl mx-auto leading-relaxed">
            Each demo persona comes with a versioned, pre-seeded 12-week dataset so you can
            immediately evaluate the Insight Engine's evidence calculations.
          </p>
        </div>

        {/* Synthetic Disclosure Notice */}
        <div className="mb-8 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Fictional Persona Disclosure:</strong> Maya and Arjun are synthetic personas created to
            demonstrate mathematical correlations in routine expenses and task load. Their data is generated
            deterministically and does not represent real individuals or live banking connections.
          </p>
        </div>

        {/* Persona Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Maya */}
          <div
            onClick={() => setSelected('maya')}
            className={`p-6 rounded-2xl bg-white dark:bg-[#1A1A19] border-2 cursor-pointer transition-all duration-200 relative flex flex-col justify-between shadow-sm hover:shadow-md ${
              selected === 'maya'
                ? 'border-green-600 ring-2 ring-green-600/20'
                : 'border-stone-200 dark:border-stone-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 flex items-center justify-center font-bold text-sm">
                  M
                </div>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                  First Job
                </span>
              </div>
              <h3 className="font-semibold text-lg mb-1">Maya, 23</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
                Bangalore • Junior Software Analyst
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed mb-4">
                Lives independently in a rented apartment. Fixed salary with work deadlines that periodically
                pile up, driving late-night convenience food deliveries.
              </p>
              <div className="text-[11px] font-mono text-stone-500 bg-stone-50 dark:bg-stone-900 p-2.5 rounded-lg space-y-1">
                <div>• 114 expense records</div>
                <div>• 78 task records</div>
                <div>• 12 weeks complete coverage</div>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={(e) => {
                e.stopPropagation()
                handleSelect('maya')
              }}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5"
            >
              {loading && selected === 'maya' ? 'Loading...' : 'Select Maya'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Arjun */}
          <div
            onClick={() => setSelected('arjun')}
            className={`p-6 rounded-2xl bg-white dark:bg-[#1A1A19] border-2 cursor-pointer transition-all duration-200 relative flex flex-col justify-between shadow-sm hover:shadow-md ${
              selected === 'arjun'
                ? 'border-green-600 ring-2 ring-green-600/20'
                : 'border-stone-200 dark:border-stone-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                  A
                </div>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                  Freelancer
                </span>
              </div>
              <h3 className="font-semibold text-lg mb-1">Arjun, 25</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
                Mumbai • Independent UI Designer
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed mb-4">
                Irregular client sprints and project delivery crunches. High variance in weekly task load
                correlating with meal delivery spikes.
              </p>
              <div className="text-[11px] font-mono text-stone-500 bg-stone-50 dark:bg-stone-900 p-2.5 rounded-lg space-y-1">
                <div>• 129 expense records</div>
                <div>• 67 task records</div>
                <div>• 12 weeks complete coverage</div>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={(e) => {
                e.stopPropagation()
                handleSelect('arjun')
              }}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5"
            >
              {loading && selected === 'arjun' ? 'Loading...' : 'Select Arjun'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Start Fresh */}
          <div
            onClick={() => setSelected('fresh')}
            className={`p-6 rounded-2xl bg-white dark:bg-[#1A1A19] border-2 cursor-pointer transition-all duration-200 relative flex flex-col justify-between shadow-sm hover:shadow-md ${
              selected === 'fresh'
                ? 'border-green-600 ring-2 ring-green-600/20'
                : 'border-stone-200 dark:border-stone-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center font-bold text-sm">
                  +
                </div>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                  Clean Slate
                </span>
              </div>
              <h3 className="font-semibold text-lg mb-1">Start Fresh</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
                Empty Personal Workspace
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed mb-4">
                Start with a zeroed-out dashboard. Enter your own genuine expenses and tasks.
                The Insight Engine will calculate your ratio as data accumulates.
              </p>
              <div className="text-[11px] font-mono text-stone-500 bg-stone-50 dark:bg-stone-900 p-2.5 rounded-lg space-y-1">
                <div>• 0 expense records</div>
                <div>• 0 task records</div>
                <div>• Clean user-entered mode</div>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={(e) => {
                e.stopPropagation()
                handleSelect('fresh')
              }}
              className="mt-6 w-full py-2.5 px-4 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              {loading && selected === 'fresh' ? 'Loading...' : 'Start Fresh'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
