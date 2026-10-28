import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0F0F0E] text-stone-900 dark:text-stone-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-green-600 mb-4 shadow-sm">
        <Compass className="w-6 h-6" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Page Not Found</h1>
      <p className="text-xs sm:text-sm text-stone-500 max-w-sm mb-6 leading-relaxed">
        The route you are looking for does not exist in this version of Life, Decoded.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold shadow-sm transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  )
}

