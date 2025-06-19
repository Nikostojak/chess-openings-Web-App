// app/training/achievements/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Trophy, Star, Target, Zap, Crown, 
  Lock, CheckCircle, TrendingUp, Award,
  Activity, Flame
} from 'lucide-react'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: string
  tier: string
  points: number
  unlocked: boolean
  progress: number
  unlockedAt?: string
  reward?: {
    xp?: number
    badge?: string
    title?: string
  }
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Record<string, Achievement[]>>({})
  const [stats, setStats] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAchievements()
  }, [])

  const loadAchievements = async () => {
    try {
      const response = await fetch('/api/training/achievements')
      const data = await response.json()
      
      setAchievements(data.byCategory || {})
      setStats(data.stats)
    } catch (error) {
      console.error('Error loading achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'from-amber-600 to-amber-700'
      case 'silver': return 'from-gray-400 to-gray-500'
      case 'gold': return 'from-yellow-400 to-yellow-500'
      case 'platinum': return 'from-purple-400 to-purple-500'
      case 'diamond': return 'from-cyan-400 to-cyan-500'
      default: return 'from-gray-400 to-gray-500'
    }
  }

  const getTierBorder = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'border-amber-600/50'
      case 'silver': return 'border-gray-400/50'
      case 'gold': return 'border-yellow-400/50'
      case 'platinum': return 'border-purple-400/50'
      case 'diamond': return 'border-cyan-400/50'
      default: return 'border-gray-400/50'
    }
  }

  const getTierBg = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-amber-600/10'
      case 'silver': return 'bg-gray-400/10'
      case 'gold': return 'bg-yellow-400/10'
      case 'platinum': return 'bg-purple-400/10'
      case 'diamond': return 'bg-cyan-400/10'
      default: return 'bg-gray-400/10'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'training': return <Target className="h-5 w-5" />
      case 'streak': return <Flame className="h-5 w-5" />
      case 'mastery': return <Crown className="h-5 w-5" />
      case 'social': return <Trophy className="h-5 w-5" />
      case 'special': return <Star className="h-5 w-5" />
      default: return <Award className="h-5 w-5" />
    }
  }

  const categories = ['all', ...Object.keys(achievements)]
  const filteredAchievements = selectedCategory === 'all' 
    ? Object.values(achievements).flat()
    : achievements[selectedCategory] || []

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            #1a1a1a,
            #1a1a1a 10px,
            transparent 10px,
            transparent 20px
          )`
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-6">
            <Activity className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-purple-300">Achievement Collection</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              Achievements
            </span>
          </h1>
          <p className="text-xl text-gray-400">
            Track your progress and unlock rewards
          </p>
        </motion.div>

        {/* Stats Overview */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8"
          >
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-800">
              <div className="text-2xl font-bold text-green-400">{stats.unlocked}</div>
              <div className="text-sm text-gray-400">Unlocked</div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-800">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-400">Total</div>
            </div>
            <div className="bg-amber-600/10 rounded-xl p-4 text-center border border-amber-600/30">
              <div className="text-2xl font-bold text-amber-400">{stats.bronze}</div>
              <div className="text-sm text-gray-400">Bronze</div>
            </div>
            <div className="bg-gray-400/10 rounded-xl p-4 text-center border border-gray-400/30">
              <div className="text-2xl font-bold text-gray-300">{stats.silver}</div>
              <div className="text-sm text-gray-400">Silver</div>
            </div>
            <div className="bg-yellow-400/10 rounded-xl p-4 text-center border border-yellow-400/30">
              <div className="text-2xl font-bold text-yellow-400">{stats.gold}</div>
              <div className="text-sm text-gray-400">Gold</div>
            </div>
            <div className="bg-purple-400/10 rounded-xl p-4 text-center border border-purple-400/30">
              <div className="text-2xl font-bold text-purple-400">{stats.platinum}</div>
              <div className="text-sm text-gray-400">Platinum</div>
            </div>
          </motion.div>
        )}

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap gap-2 mb-8 justify-center"
        >
          {categories.map((category) => (
            <motion.button
              key={category}
              onClick={() => setSelectedCategory(category)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
              }`}
            >
              {category !== 'all' && getCategoryIcon(category)}
              <span className="capitalize">{category}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className={`relative bg-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border transition-all ${
                achievement.unlocked 
                  ? `${getTierBorder(achievement.tier)} ${getTierBg(achievement.tier)} hover:scale-105` 
                  : 'border-gray-800 opacity-75'
              }`}
            >
              {/* Tier Banner */}
              <div className={`bg-gradient-to-r ${getTierColor(achievement.tier)} p-1`}>
                <div className="text-center text-white text-xs font-semibold uppercase">
                  {achievement.tier}
                </div>
              </div>

              {/* Achievement Content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl">{achievement.icon}</div>
                  {achievement.unlocked ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <CheckCircle className="h-8 w-8 text-green-400" />
                    </motion.div>
                  ) : (
                    <Lock className="h-8 w-8 text-gray-600" />
                  )}
                </div>

                <h3 className="text-lg font-bold mb-2">
                  {achievement.name}
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  {achievement.description}
                </p>

                {/* Progress Bar */}
                {!achievement.unlocked && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{achievement.progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <motion.div
                        className={`h-full bg-gradient-to-r ${getTierColor(achievement.tier)} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${achievement.progress}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </div>
                )}

                {/* Points & Rewards */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="font-medium">{achievement.points} pts</span>
                  </div>
                  
                  {achievement.reward && (
                    <div className="flex items-center space-x-2">
                      {achievement.reward.xp && (
                        <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded border border-blue-600/30">
                          +{achievement.reward.xp} XP
                        </span>
                      )}
                      {achievement.reward.title && (
                        <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-1 rounded border border-purple-600/30">
                          Title
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Unlock Date */}
                {achievement.unlocked && achievement.unlockedAt && (
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <p className="text-xs text-gray-500 text-center">
                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAchievements.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center py-12"
          >
            <Trophy className="h-16 w-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No achievements yet</h3>
            <p className="text-gray-500">
              Start training to unlock your first achievements!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}