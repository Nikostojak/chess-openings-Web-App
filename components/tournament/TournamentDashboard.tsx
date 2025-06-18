// components/tournament/TournamentDashboard.tsx - Enhanced Live Tournament Monitoring

'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Crown, Trophy, Calendar, TrendingUp, Users, Activity, 
  RefreshCw, AlertCircle, CheckCircle, Clock, Zap, Play 
} from 'lucide-react'

interface TournamentInfo {
  name: string
  ongoing: boolean
  tier: string
  gamesCount?: number
  lastUpdate?: string
  participants?: number
  currentRound?: string
}

interface SystemStatus {
  jobs: {
    name: string
    running: boolean
    scheduled: boolean
    lastRun?: string
    nextRun?: string
    status?: 'success' | 'error' | 'running'
  }[]
  tournaments?: {
    activeTournaments: number
    tournaments: TournamentInfo[]
    lastEliteDetection?: string
  }
  system: {
    uptime: number
    timestamp: string
    version?: string
    environment?: string
  }
  stats?: {
    totalGamesProcessed: number
    eliteGamesWeighted: number
    lastDataUpdate: string
  }
}

interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

export default function TournamentDashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 5000)
  }, [])

  const loadSystemStatus = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      
      const response = await fetch('/api/admin/data-jobs')
      if (!response.ok) throw new Error('Failed to fetch status')
      
      const data = await response.json()
      setStatus(data.data)
      setError(null)
      
      if (isRefresh) {
        addToast('success', 'System status refreshed')
      }
    } catch (error) {
      console.error('Error loading system status:', error)
      setError('Failed to load system status')
      if (isRefresh) {
        addToast('error', 'Failed to refresh system status')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [addToast])

  useEffect(() => {
    loadSystemStatus()
    // Refresh every 30 seconds
    const interval = setInterval(() => loadSystemStatus(), 30000)
    return () => clearInterval(interval)
  }, [loadSystemStatus])

  const triggerAction = async (action: string, type?: string) => {
    const actionKey = `${action}-${type || 'default'}`
    
    try {
      setActionLoading(actionKey)
      const response = await fetch('/api/admin/data-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, type })
      })
      
      if (!response.ok) throw new Error('Action failed')
      
      const result = await response.json()
      console.log('Action result:', result)
      
      addToast('success', `${action.replace('_', ' ')} completed successfully`)
      
      // Refresh status after action
      setTimeout(() => loadSystemStatus(true), 1000)
    } catch (error) {
      console.error('Action failed:', error)
      addToast('error', `Failed to execute ${action.replace('_', ' ')}`)
    } finally {
      setActionLoading(null)
    }
  }

  const getTournamentIcon = (tier: string) => {
    switch (tier) {
      case 'WORLD_CHAMPIONSHIP': return '👑'
      case 'CANDIDATES': return '🏆'
      case 'SUPER_ELITE': return '⭐'
      case 'ELITE': return '🎯'
      case 'HIGH': return '🔥'
      default: return '📋'
    }
  }

  const getTournamentColor = (tier: string, ongoing: boolean) => {
    const base = (() => {
      switch (tier) {
        case 'WORLD_CHAMPIONSHIP': return 'border-yellow-400 text-yellow-900'
        case 'CANDIDATES': return 'border-purple-400 text-purple-900'
        case 'SUPER_ELITE': return 'border-blue-400 text-blue-900'
        case 'ELITE': return 'border-green-400 text-green-900'
        case 'HIGH': return 'border-orange-400 text-orange-900'
        default: return 'border-gray-400 text-gray-900'
      }
    })()
    
    const bg = ongoing ? 'bg-gradient-to-r from-yellow-50 to-yellow-100' : 'bg-gray-50'
    return `${base} ${bg}`
  }

  const getJobStatusIcon = (job: any) => {
    if (job.running) return <Play className="h-4 w-4 text-green-600" />
    if (job.status === 'error') return <AlertCircle className="h-4 w-4 text-red-600" />
    if (job.status === 'success') return <CheckCircle className="h-4 w-4 text-green-600" />
    return <Clock className="h-4 w-4 text-gray-600" />
  }

  const getUptimeFormatted = (uptime: number) => {
    const days = Math.floor(uptime / 86400)
    const hours = Math.floor((uptime % 86400) / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h`
    return `${hours}h ${minutes}m`
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  if (loading && !status) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toast Messages */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`px-4 py-3 rounded-lg shadow-lg ${
                toast.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
                toast.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
                'bg-blue-100 text-blue-800 border border-blue-200'
              }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <Activity className="mr-3 h-6 w-6" />
              Elite Chess Data Pipeline
            </h2>
            <p className="opacity-90 mt-1">
              Real-time tournament tracking & professional chess statistics
            </p>
            {status?.system.environment && (
              <span className="inline-block mt-2 px-2 py-1 bg-white bg-opacity-20 rounded text-xs">
                {status.system.environment.toUpperCase()}
              </span>
            )}
          </div>
          <div className="text-right space-y-2">
            <div>
              <div className="text-sm opacity-90">System Uptime</div>
              <div className="text-xl font-mono">
                {status && getUptimeFormatted(status.system.uptime)}
              </div>
            </div>
            <button
              onClick={() => loadSystemStatus(true)}
              disabled={refreshing}
              className="flex items-center px-3 py-1 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors text-sm"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Active Tournaments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-yellow-600" />
              Active Elite Tournaments
            </h3>
            {status?.tournaments?.lastEliteDetection && (
              <span className="text-xs text-gray-500">
                Last scan: {new Date(status.tournaments.lastEliteDetection).toLocaleTimeString()}
              </span>
            )}
          </div>

          {status?.tournaments?.activeTournaments === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p>No elite tournaments currently active</p>
              <p className="text-sm mt-1">
                Elite events are detected automatically when they start
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {status?.tournaments?.tournaments.map((tournament, index) => (
                <div
                  key={index}
                  className={`border-2 rounded-lg p-4 ${getTournamentColor(tournament.tier, tournament.ongoing)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">
                        {getTournamentIcon(tournament.tier)}
                      </span>
                      <div>
                        <div className="font-semibold">{tournament.name}</div>
                        <div className="text-sm opacity-80 space-y-1">
                          <div>Tier: {tournament.tier.replace('_', ' ')}</div>
                          {tournament.gamesCount && (
                            <div>Games: {formatNumber(tournament.gamesCount)}</div>
                          )}
                          {tournament.participants && (
                            <div>Players: {tournament.participants}</div>
                          )}
                          {tournament.currentRound && (
                            <div>Round: {tournament.currentRound}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {tournament.ongoing ? (
                        <span className="flex items-center text-green-600 mb-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                          LIVE
                        </span>
                      ) : (
                        <span className="text-gray-600 mb-2 block">Finished</span>
                      )}
                      {tournament.lastUpdate && (
                        <div className="text-xs text-gray-500">
                          {new Date(tournament.lastUpdate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tournament Actions */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => triggerAction('test_tournaments')}
              disabled={actionLoading === 'test_tournaments-default'}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center justify-center"
            >
              {actionLoading === 'test_tournaments-default' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                'Refresh Tournaments'
              )}
            </button>
            <button
              onClick={() => triggerAction('monitor_wc')}
              disabled={actionLoading === 'monitor_wc-default'}
              className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 text-sm flex items-center justify-center"
            >
              {actionLoading === 'monitor_wc-default' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                'Check WC'
              )}
            </button>
          </div>
        </div>

        {/* Background Jobs Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="mr-2 h-5 w-5 text-green-600" />
            Background Jobs
          </h3>

          <div className="space-y-3">
            {status?.jobs.map((job, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  {getJobStatusIcon(job)}
                  <div className="ml-3">
                    <div className="font-medium text-sm">
                      {job.name.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-xs text-gray-600">
                      {getJobDescription(job.name)}
                    </div>
                    {job.lastRun && (
                      <div className="text-xs text-gray-500">
                        Last: {new Date(job.lastRun).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-medium ${
                    job.running ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {job.running ? 'Running' : 'Idle'}
                  </span>
                  {job.nextRun && !job.running && (
                    <div className="text-xs text-gray-500">
                      Next: {new Date(job.nextRun).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Job Control Actions */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => triggerAction('trigger_update', 'tournament')}
              disabled={actionLoading === 'trigger_update-tournament'}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm flex items-center justify-center"
            >
              {actionLoading === 'trigger_update-tournament' ? (
                <Zap className="h-4 w-4 animate-pulse" />
              ) : (
                'Tournament Update'
              )}
            </button>
            <button
              onClick={() => triggerAction('trigger_update', 'hourly')}
              disabled={actionLoading === 'trigger_update-hourly'}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm flex items-center justify-center"
            >
              {actionLoading === 'trigger_update-hourly' ? (
                <Zap className="h-4 w-4 animate-pulse" />
              ) : (
                'Quick Update'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced System Stats */}
      {status && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
            System Statistics
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {status.jobs?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Active Jobs</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {status.tournaments?.activeTournaments || 0}
              </div>
              <div className="text-sm text-gray-600">Elite Events</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {getUptimeFormatted(status.system.uptime)}
              </div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {new Date(status.system.timestamp).toLocaleTimeString()}
              </div>
              <div className="text-sm text-gray-600">Last Update</div>
            </div>

            {status.stats && (
              <>
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">
                    {formatNumber(status.stats.totalGamesProcessed)}
                  </div>
                  <div className="text-sm text-gray-600">Games Processed</div>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {formatNumber(status.stats.eliteGamesWeighted)}
                  </div>
                  <div className="text-sm text-gray-600">Elite Weighted</div>
                </div>
              </>
            )}
          </div>

          {status.stats?.lastDataUpdate && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Last data update: {new Date(status.stats.lastDataUpdate).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        </div>
      )}
    </div>
  )
}

function getJobDescription(jobName: string): string {
  switch (jobName) {
    case 'daily-update':
      return 'Daily data processing at 2:00 AM UTC'
    case 'hourly-update':
      return 'Hourly updates during peak hours (12-23 UTC)'
    case 'wc-monitoring':
      return 'World Championship tracking (every 10 min)'
    case 'tournament-tracker':
      return 'Elite tournament detection (hourly)'
    case 'weekly-cleanup':
      return 'Weekly database maintenance (Sunday 3 AM)'
    case 'rate-limit-monitor':
      return 'API rate limiting monitor'
    default:
      return 'Background data processing'
  }
}