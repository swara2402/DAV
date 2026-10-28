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

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0F0F0E] text-stone-900 dark:text-stone-100 flex flex-col md:flex-row transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151514] p-5 shrink-0">
        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-2.5 mb-8 px-2">
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            LD
          </div>
          <div>
            <div className="font-semibold tracking-tight text-base leading-none">
              Life, Decoded
            </div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
              Behavioral Finance
            </div>
          </div>
        </Link>

        {/* Persona Indicator Card */}
        <div className="mb-6 p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-500 dark:text-stone-400">
              Active Persona
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Synthetic
            </span>
          </div>
          <div className="font-medium text-sm truncate">{personaLabel}</div>
          <Link
            to="/persona"
            className="text-xs text-green-600 dark:text-green-400 hover:underline mt-1 inline-block"
          >
            Switch persona →
          </Link>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-stone-100 dark:bg-stone-800/80 text-stone-950 dark:text-white font-semibold'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/40'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4',
                    isActive ? 'text-green-600' : 'text-stone-400'
                  )}
                />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Action Shortcuts */}
        <div className="space-y-2 pt-4 border-t border-stone-200 dark:border-stone-800">
          {onAddExpense && (
            <button
              onClick={onAddExpense}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add Expense
            </button>
          )}
          {onAddTask && (
            <button
              onClick={onAddTask}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add Task
            </button>
          )}
        </div>

        {/* Footer controls */}
        <div className="pt-4 mt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-stone-500">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs hover:text-red-600 transition px-2 py-1.5"
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
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-[#151514]">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold text-xs">
              LD
            </div>
            <span className="font-semibold text-sm">Life, Decoded</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-500"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-[#151514] border-t border-stone-200 dark:border-stone-800 flex justify-around py-2 px-4 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors',
                isActive
                  ? 'text-green-600 font-semibold'
                  : 'text-stone-500 dark:text-stone-400'
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
