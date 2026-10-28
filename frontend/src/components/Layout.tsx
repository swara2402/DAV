import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Lightbulb,
  Settings as SettingsIcon,
  Moon,
  Sun,
  LogOut,
  PlusCircle,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { cn } from '../lib/utils'

interface LayoutProps {
  children: React.ReactNode
  onAddExpense?: () => void
  onAddTask?: () => void
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  onAddExpense,
  onAddTask,
}) => {
  const { logout, activePersona } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Insight Engine', path: '/insight', icon: Lightbulb },
    { label: 'Settings', path: '/settings', icon: SettingsIcon },
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const personaLabel =
    activePersona === 'maya'
      ? 'Maya (23, Bangalore)'
      : activePersona === 'arjun'
      ? 'Arjun (25, Mumbai)'
      : 'Personal Workspace'

  const personaRole =
    activePersona === 'maya'
      ? 'First-Job Professional'
      : activePersona === 'arjun'
      ? 'Freelance Designer'
      : 'Empty State Workspace'

  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 flex flex-col md:flex-row transition-colors duration-200 selection:bg-emerald-500/20 selection:text-emerald-950 dark:selection:text-emerald-200">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl p-5 shrink-0 sticky top-0 h-screen z-20">
        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-2.5 mb-7 px-1.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm shadow-glow-emerald-sm group-hover:scale-105 transition-transform">
            LD
          </div>
          <div>
            <div className="font-bold tracking-tight text-sm leading-none text-zinc-950 dark:text-white">
              Life, Decoded
            </div>
            <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-1">
              Behavioral Engine
            </div>
          </div>
        </Link>

        {/* Persona Indicator Card */}
        <div className="mb-6 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/80 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 dark:text-zinc-400">
              Active Persona
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              {activePersona === 'fresh' ? 'Personal' : 'Synthetic'}
            </span>
          </div>
          <div className="font-bold text-xs truncate text-zinc-900 dark:text-zinc-100">{personaLabel}</div>
          <div className="text-[11px] text-zinc-500 truncate">{personaRole}</div>
          <Link
            to="/persona"
            className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mt-2 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
          >
            Switch persona →
          </Link>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 relative',
                  isActive
                    ? 'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-950 dark:text-white shadow-subtle'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-500 rounded-r-full" />
                )}
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 group-hover:text-zinc-600'
                  )}
                />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Quick Action Buttons */}
        <div className="space-y-2 pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80">
          {onAddExpense && (
            <button
              onClick={onAddExpense}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white transition-all shadow-glow-emerald-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Expense</span>
            </button>
          )}
          {onAddTask && (
            <button
              onClick={onAddTask}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 transition-all active:scale-[0.98]"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          )}
        </div>

        {/* Footer controls */}
        <div className="pt-4 mt-4 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between text-zinc-500">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-600" />
            )}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors px-2 py-1.5 rounded-lg"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Mobile Topbar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#121214]/80 backdrop-blur-md sticky top-0 z-20">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              LD
            </div>
            <span className="font-bold text-sm tracking-tight">Life, Decoded</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-zinc-600" />
              )}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-7 md:p-9 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-[#121214]/90 backdrop-blur-xl border-t border-zinc-200/80 dark:border-zinc-800/80 flex justify-around py-2.5 px-4 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-semibold transition-colors',
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-zinc-500 dark:text-zinc-400'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
