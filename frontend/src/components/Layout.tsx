import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Lightbulb,
  Settings as SettingsIcon,
  Moon,
  Sun,
  LogOut,
  Plus,
  ChevronDown,
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

  const personaName =
    activePersona === 'maya'
      ? 'Maya'
      : activePersona === 'arjun'
      ? 'Arjun'
      : 'Personal'

  const personaMeta =
    activePersona === 'maya'
      ? '23 • Bangalore • Tech'
      : activePersona === 'arjun'
      ? '25 • Mumbai • Design'
      : 'Clean Slate Workspace'

  return (
    <div className="min-h-screen bg-[#F6F5F2] dark:bg-[#0C0D0E] text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-150">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 h-14 border-b border-[#E8E6DF] dark:border-white/[0.08] bg-[#F6F5F2]/90 dark:bg-[#0C0D0E]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Brand */}
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs flex items-center justify-center tracking-wider">
              LD
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-950 dark:text-white">
              Life, Decoded
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40'
                  )}
                >
                  <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-zinc-950 dark:text-white' : 'text-zinc-400')} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2.5">
          {/* Persona Switcher Pill */}
          <Link
            to="/persona"
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-[#E8E6DF] dark:border-white/[0.08] bg-white dark:bg-[#141518] hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors shadow-sm"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <div className="text-left text-xs leading-none">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{personaName}</span>
              <span className="hidden sm:inline text-zinc-400 dark:text-zinc-500 ml-1.5 text-[11px]">{personaMeta}</span>
            </div>
            <ChevronDown className="w-3 h-3 text-zinc-400 ml-0.5" />
          </Link>

          {/* Quick Add Actions */}
          <div className="hidden sm:flex items-center gap-1.5 pl-1.5 border-l border-[#E8E6DF] dark:border-white/[0.08]">
            {onAddExpense && (
              <button
                onClick={onAddExpense}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-all shadow-sm active:scale-[0.98]"
              >
                <Plus className="w-3 h-3" />
                <span>Expense</span>
              </button>
            )}
            {onAddTask && (
              <button
                onClick={onAddTask}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-[#E8E6DF] dark:border-white/[0.08] bg-white dark:bg-[#141518] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-all shadow-sm active:scale-[0.98]"
              >
                <Plus className="w-3 h-3" />
                <span>Task</span>
              </button>
            )}
          </div>

          {/* Theme & Sign Out */}
          <div className="flex items-center gap-1 pl-1.5 border-l border-[#E8E6DF] dark:border-white/[0.08]">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-zinc-600" />}
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800 text-zinc-500 hover:text-rose-600 transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#F6F5F2]/95 dark:bg-[#0C0D0E]/95 backdrop-blur-xl border-t border-[#E8E6DF] dark:border-white/[0.08] flex justify-around py-2 px-4 shadow-lg">
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
                  ? 'text-zinc-950 dark:text-white font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
