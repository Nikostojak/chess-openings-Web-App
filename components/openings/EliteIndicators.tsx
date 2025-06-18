'use client'

import { useState, useEffect } from 'react'
import { 
  Crown, Trophy, Calendar, Users, 
  Zap, Star, Target, Award, ChevronRight, Info
} from 'lucide-react'

interface EliteStats {
  ecoCode: string
  totalGames: number
  eliteGames: number
  eliteWeight: number
  tournaments: {
    worldChampionship: number
    candidates: number
    superElite: number
    elite: number
  }
  trending: {
    isHot: boolean
    weeklyGrowth: number
    lastEliteGame: string
  }
  topPlayers: {
    name: string
    rating: number
    gamesPlayed: number
    winRate: number
  }[]
  recentEliteGames: {
    white: string
    black: string
    result: string
    tournament: string
    date: string
    rating: number
  }[]
}

interface EliteIndicatorsProps {
  ecoCode: string
  className?: string
}

export default function EliteIndicators({ ecoCode, className = '' }: EliteIndicatorsProps) {
  const [eliteStats, setEliteStats] = useState<EliteStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadEliteStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ecoCode])

  const loadEliteStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/openings/${ecoCode}/elite-stats`)
      if (!response.ok) throw new Error('Failed to fetch elite stats')
      
      const data = await response.json()
      setEliteStats(data.eliteStats)
      setError(null)
    } catch (error) {
      console.error('Error loading elite stats:', error)
      setError('Failed to load elite data')
    } finally {
      setLoading(false)
    }
  }

  const getEliteLevel = () => {
    if (!eliteStats) return null
    
    const { tournaments } = eliteStats
    if (tournaments.worldChampionship > 0) return 'WORLD_CHAMPIONSHIP'
    if (tournaments.candidates > 0) return 'CANDIDATES'
    if (tournaments.superElite > 5) return 'SUPER_ELITE'
    if (tournaments.elite > 10) return 'ELITE'
    if (eliteStats.eliteGames > 50) return 'POPULAR'
    return null
  }

  const getEliteBadge = () => {
    const level = getEliteLevel()
    if (!level) return null

    const badges = {
      WORLD_CHAMPIONSHIP: {
        icon: '👑',
        text: 'WC Opening',
        color: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white',
        description: 'Played in World Championship'
      },
      CANDIDATES: {
        icon: '🏆',
        text: 'Candidates',
        color: 'bg-gradient-to-r from-purple-400 to-purple-600 text-white',
        description: 'Featured in Candidates Tournament'
      },
      SUPER_ELITE: {
        icon: '⭐',
        text: 'Super Elite',
        color: 'bg-gradient-to-r from-blue-400 to-blue-600 text-white',
        description: 'Popular among super elite players'
      },
      ELITE: {
        icon: '🎯',
        text: 'Elite Choice',
        color: 'bg-gradient-to-r from-green-400 to-green-600 text-white',
        description: 'Popular among elite players'
      },
      POPULAR: {
        icon: '🔥',
        text: 'Tournament Play',
        color: 'bg-gradient-to-r from-orange-400 to-orange-600 text-white',
        description: 'Frequently played in tournaments'
      }
    }

    return badges[level]
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const getResultIcon = (result: string) => {
    switch (result) {
      case '1-0': return '⚪'
      case '0-1': return '⚫'
      case '1/2-1/2': return '⚖️'
      default: return '❓'
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (error || !eliteStats) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="text-gray-500 text-sm">
          Elite data not available
        </div>
      </div>
    )
  }

  const badge = getEliteBadge()
  const elitePercentage = eliteStats.totalGames > 0 ? eliteStats.eliteGames / eliteStats.totalGames : 0

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header with Elite Badge */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Target className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Elite Tournament Data</h3>
            {eliteStats.trending.isHot && (
              <span className="flex items-center px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Trending
              </span>
            )}
          </div>
          
          {badge && (
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
              <span className="mr-1">{badge.icon}</span>
              {badge.text}
            </div>
          )}
        </div>

        {badge && (
          <div className="mt-2 text-sm text-gray-600">
            {badge.description}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {formatNumber(eliteStats.eliteGames)}
            </div>
            <div className="text-xs text-gray-600">Elite Games</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {formatPercentage(elitePercentage)}
            </div>
            <div className="text-xs text-gray-600">Elite Ratio</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {eliteStats.eliteWeight.toFixed(1)}x
            </div>
            <div className="text-xs text-gray-600">Weight Factor</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {eliteStats.trending.weeklyGrowth > 0 ? '+' : ''}{eliteStats.trending.weeklyGrowth}
            </div>
            <div className="text-xs text-gray-600">Weekly Δ</div>
          </div>
        </div>

        {/* Tournament Breakdown */}
        <div className="space-y-2 mb-4">
          {eliteStats.tournaments.worldChampionship > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center">
                <Crown className="h-4 w-4 text-yellow-600 mr-2" />
                World Championship
              </span>
              <span className="font-medium">{eliteStats.tournaments.worldChampionship} games</span>
            </div>
          )}
          
          {eliteStats.tournaments.candidates > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center">
                <Trophy className="h-4 w-4 text-purple-600 mr-2" />
                Candidates
              </span>
              <span className="font-medium">{eliteStats.tournaments.candidates} games</span>
            </div>
          )}
          
          {eliteStats.tournaments.superElite > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center">
                <Star className="h-4 w-4 text-blue-600 mr-2" />
                Super Elite Events
              </span>
              <span className="font-medium">{eliteStats.tournaments.superElite} games</span>
            </div>
          )}
          
          {eliteStats.tournaments.elite > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center">
                <Award className="h-4 w-4 text-green-600 mr-2" />
                Elite Events
              </span>
              <span className="font-medium">{eliteStats.tournaments.elite} games</span>
            </div>
          )}
        </div>

        {/* Show Details Toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-center px-4 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
          <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="border-t bg-gray-50">
          <div className="p-4 space-y-4">
            
            {/* Top Players */}
            {eliteStats.topPlayers.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Top Elite Players
                </h4>
                <div className="space-y-2">
                  {eliteStats.topPlayers.slice(0, 3).map((player, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center mr-2">
                          {index + 1}
                        </span>
                        <span className="font-medium">{player.name}</span>
                        <span className="text-gray-500 ml-1">({player.rating})</span>
                      </div>
                      <div className="text-right">
                        <div>{player.gamesPlayed} games</div>
                        <div className="text-xs text-gray-600">
                          {formatPercentage(player.winRate)} win rate
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Elite Games */}
            {eliteStats.recentEliteGames.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Recent Elite Games
                </h4>
                <div className="space-y-2">
                  {eliteStats.recentEliteGames.slice(0, 3).map((game, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium">
                          {game.white} vs {game.black}
                        </div>
                        <span className="text-lg">
                          {getResultIcon(game.result)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>{game.tournament}</div>
                        <div className="flex justify-between">
                          <span>{new Date(game.date).toLocaleDateString()}</span>
                          <span>Avg: {game.rating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Source Info */}
            <div className="text-xs text-gray-500 border-t pt-3 flex items-center">
              <Info className="h-3 w-3 mr-1" />
              Elite data from Lichess rated games (1600+ rating) with tournament weighting
            </div>
          </div>
        </div>
      )}
    </div>
  )
}