// app/training/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Zap, Target, Trophy, Clock, Settings, Lock,
  TrendingUp, Award, Calendar, Gift, ChevronRight,
  Brain, Puzzle, Mountain, Skull
} from 'lucide-react'

const TRAINING_MODES = [
  {
    id: 'blitz',
    name: 'Blitz Training',
    description: 'Fast-paced training with 10 seconds per move',
    icon: '⚡',
    color: 'orange',
    config: {
      mode: 'blitz' as const,
      timePerMove: 10,
      questionsPerSession: 10,
      difficultyRange: [1, 4] as [number, number]
    },
    features: [
      '10 seconds per move',
      'Bonus points for speed',
      'Streak multipliers',
      'Quick 5-minute sessions'
    ]
  },
  {
    id: 'rapid',
    name: 'Rapid Training',
    description: 'Balanced training with 30 seconds per move',
    icon: '🎯',
    color: 'blue',
    config: {
      mode: 'rapid' as const,
      timePerMove: 30,
      questionsPerSession: 15,
      difficultyRange: [2, 5] as [number, number]
    },
    features: [
      '30 seconds per move',
      'More complex positions',
      'Hint system available',
      'Detailed explanations'
    ]
  },
  {
    id: 'puzzle',
    name: 'Puzzle Mode',
    description: 'No time limit - focus on finding the best move',
    icon: '🧩',
    color: 'purple',
    config: {
      mode: 'puzzle' as const,
      timePerMove: 300,
      questionsPerSession: 5,
      difficultyRange: [3, 5] as [number, number]
    },
    features: [
      'No time pressure',
      'Complex positions',
      'Multiple hints allowed',
      'Deep analysis mode'
    ],
    unlockLevel: 5
  },
  {
    id: 'marathon',
    name: 'Marathon Mode',
    description: 'Test your endurance with 50+ questions',
    icon: '🏃',
    color: 'green',
    config: {
      mode: 'marathon' as const,
      timePerMove: 15,
      questionsPerSession: 50,
      difficultyRange: [1, 5] as [number, number]
    },
    features: [
      '50+ questions',
      'Increasing difficulty',
      'Endurance test',
      'Huge XP rewards'
    ],
    unlockLevel: 10
  },
  {
    id: 'survival',
    name: 'Survival Mode',
    description: 'How long can you last? One mistake ends it all!',
    icon: '💀',
    color: 'red',
    config: {
      mode: 'survival' as const,
      timePerMove: 8,
      questionsPerSession: 999,
      difficultyRange: [1, 5] as [number, number]
    },
    features: [
      'One mistake = game over',
      'Increasing speed',
      'Leaderboard rankings',
      'Special badges'
    ],
    unlockLevel: 15
  },
  {
    id: 'custom',
    name: 'Custom Training',
    description: 'Create your own training session',
    icon: '⚙️',
    color: 'gray',
    config: {
      mode: 'custom' as const,
      timePerMove: 20,
      questionsPerSession: 10,
      difficultyRange: [1, 5] as [number, number]
    },
    features: [
      'Choose time limits',
      'Select openings',
      'Set difficulty',
      'Track progress'
    ],
    unlockLevel: 3
  }
]

export default function TrainingHomePage() {
  const router = useRouter()
  const [userLevel, setUserLevel] = useState(1)
  const [dailyBonus, setDailyBonus] = useState<{
    claimed: boolean
    streak: number
    nextBonusIn?: number
  }>({ claimed: false, streak: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const statsResponse = await fetch('/api/training/stats')
      const statsData = await statsResponse.json()
      
      if (statsData.stats) {
        const level = Math.floor(statsData.stats.experience / 1000) + 1
        setUserLevel(level)
      }

      const bonusResponse = await fetch('/api/training/daily-bonus')
      const bonusData = await bonusResponse.json()
      
      setDailyBonus({
        claimed: bonusData.claimedToday || false,
        streak: bonusData.currentStreak || 0,
        nextBonusIn: bonusData.nextBonusIn
      })
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const claimDailyBonus = async () => {
    try {
      const response = await fetch('/api/training/daily-bonus', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        setDailyBonus({
          claimed: true,
          streak: data.currentStreak,
          nextBonusIn: 24
        })
        
        alert(`Daily bonus claimed! +${data.reward.xp} XP`)
      }
    } catch (error) {
      console.error('Error claiming bonus:', error)
    }
  }

  const getModeIcon = (modeId: string) => {
    switch (modeId) {
      case 'blitz': return <Zap className="h-8 w-8" />
      case 'rapid': return <Target className="h-8 w-8" />
      case 'puzzle': return <Puzzle className="h-8 w-8" />
      case 'marathon': return <Mountain className="h-8 w-8" />
      case 'survival': return <Skull className="h-8 w-8" />
      case 'custom': return <Settings className="h-8 w-8" />
      default: return <Brain className="h-8 w-8" />
    }
  }

  const getModeColor = (color: string) => {
    const colors = {
      orange: 'from-orange-500 to-orange-600',
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      green: 'from-green-500 to-green-600',
      red: 'from-red-500 to-red-600',
      gray: 'from-gray-500 to-gray-600'
    }
    return colors[color as keyof typeof colors] || colors.gray
  }

  const canAccessMode = (mode: typeof TRAINING_MODES[number]) => {
    return !mode.unlockLevel || userLevel >= mode.unlockLevel
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Chess Training Center
          </h1>
          <p className="text-xl text-gray-400">
            Choose your training mode and improve your opening knowledge
          </p>
        </div>

        {/* Daily Bonus Card */}
        <div className="mb-8">
          <div className={`bg-gradient-to-r ${
            dailyBonus.claimed 
              ? 'from-gray-800 to-gray-900' 
              : 'from-yellow-900/30 to-orange-900/30'
          } rounded-2xl p-6 shadow-lg border ${
            dailyBonus.claimed ? 'border-gray-800' : 'border-yellow-800/50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center shadow-md">
                  <Gift className={`h-8 w-8 ${
                    dailyBonus.claimed ? 'text-gray-500' : 'text-yellow-500'
                  }`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Daily Login Bonus
                  </h3>
                  <p className="text-gray-300">
                    {dailyBonus.streak > 0 
                      ? `${dailyBonus.streak} day streak! 🔥`
                      : 'Start your streak today!'
                    }
                  </p>
                </div>
              </div>
              
              {dailyBonus.claimed ? (
                <div className="text-right">
                  <p className="text-sm text-gray-400">Next bonus in</p>
                  <p className="text-lg font-bold text-gray-300">
                    {dailyBonus.nextBonusIn}h
                  </p>
                </div>
              ) : (
                <button
                  onClick={claimDailyBonus}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
                >
                  Claim Bonus
                </button>
              )}
            </div>
            
            {/* Upcoming bonuses preview */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400 mb-2">Upcoming bonuses:</p>
              <div className="flex space-x-2">
                {[1, 2, 3, 7, 14, 21, 30].map((day) => (
                  <div
                    key={day}
                    className={`text-center p-2 rounded-lg ${
                      day <= dailyBonus.streak 
                        ? 'bg-green-900/30 text-green-400 border border-green-700' 
                        : 'bg-gray-800 text-gray-500 border border-gray-700'
                    }`}
                  >
                    <div className="text-xs">Day {day}</div>
                    <div className="text-sm font-bold">
                      {day === 7 ? '300' : day === 14 ? '500' : day === 30 ? '2000' : '50+'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link href="/training/stats" className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Your Level</p>
                <p className="text-2xl font-bold text-white">Level {userLevel}</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
          </Link>
          
          <Link href="/training/stats" className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Today's XP</p>
                <p className="text-2xl font-bold text-blue-400">0</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </Link>
          
          <Link href="/training/achievements" className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Achievements</p>
                <p className="text-2xl font-bold text-purple-400">0/50</p>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
          </Link>
          
          <Link href="/training/schedule" className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Due Today</p>
                <p className="text-2xl font-bold text-green-400">5</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </Link>
        </div>

        {/* Training Modes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRAINING_MODES && TRAINING_MODES.length > 0 ? (
            TRAINING_MODES.map((mode) => {
              const isLocked = !canAccessMode(mode)
              
              return (
                <div
                  key={mode.id}
                  className={`relative ${isLocked ? 'opacity-75' : ''}`}
                >
                  <Link
                    href={isLocked ? '#' : `/training/${mode.id}`}
                    className={`block bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden transition-all ${
                      isLocked ? 'cursor-not-allowed' : 'hover:border-gray-700 hover:scale-105'
                    }`}
                  >
                    {/* Mode Header */}
                    <div className={`bg-gradient-to-r ${getModeColor(mode.color)} p-6 text-white`}>
                      <div className="flex items-center justify-between mb-4">
                        {getModeIcon(mode.id)}
                        {isLocked && (
                          <div className="bg-black bg-opacity-50 rounded-full p-2">
                            <Lock className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{mode.name}</h3>
                      <p className="text-white text-opacity-90">{mode.description}</p>
                    </div>
                    
                    {/* Mode Features */}
                    <div className="p-6">
                      <div className="space-y-2 mb-4">
                        {mode.features.map((feature, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-400">
                            <ChevronRight className="h-4 w-4 mr-2 text-gray-600" />
                            {feature}
                          </div>
                        ))}
                      </div>
                      
                      {isLocked ? (
                        <div className="text-center py-3 bg-gray-800 rounded-lg">
                          <p className="text-sm text-gray-400">
                            Unlock at Level {mode.unlockLevel}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">Session length</p>
                            <p className="text-sm font-semibold text-gray-300">
                              ~{Math.ceil(mode.config.questionsPerSession * mode.config.timePerMove / 60)} min
                            </p>
                          </div>
                          <div className="text-green-400 font-semibold flex items-center">
                            Play
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              )
            })
          ) : (
            <div className="col-span-3 text-center py-12">
              <p className="text-gray-500">Loading training modes...</p>
            </div>
          )}
        </div>

        {/* Spaced Repetition Card */}
        <div className="mt-12 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-2xl p-8 border border-purple-800/50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-4 text-white">Smart Review System</h2>
                <p className="text-lg mb-6 text-gray-300">
                  Our spaced repetition algorithm ensures you review openings at optimal intervals 
                  for long-term retention. Never forget an opening again!
                </p>
                <div className="flex space-x-4">
                  <Link
                    href="/training/review"
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Start Smart Review
                  </Link>
                  <Link
                    href="/training/settings"
                    className="bg-gray-800 border border-gray-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-all"
                  >
                    Customize Algorithm
                  </Link>
                </div>
              </div>
              <div className="hidden lg:block">
                <Brain className="h-32 w-32 text-purple-500 opacity-30" />
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Progress */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Recent Achievements</h2>
            <Link href="/training/achievements" className="text-green-400 hover:text-green-300 font-medium">
              View All →
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['first_session', 'streak_3', 'accuracy_80', 'xp_1000'].map((achievementId) => (
              <div
                key={achievementId}
                className="bg-gray-900/50 rounded-xl p-4 text-center border-2 border-gray-800 hover:border-yellow-600 transition-colors"
              >
                <div className="text-3xl mb-2">🏆</div>
                <p className="text-sm font-medium text-gray-300">
                  {achievementId === 'first_session' && 'First Steps'}
                  {achievementId === 'streak_3' && '3 Day Streak'}
                  {achievementId === 'accuracy_80' && 'Sharp Mind'}
                  {achievementId === 'xp_1000' && 'Rising Star'}
                </p>
                <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full"
                    style={{ width: '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}