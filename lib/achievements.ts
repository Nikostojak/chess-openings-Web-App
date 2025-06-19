// lib/achievements.ts

import { prisma } from './db'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'training' | 'streak' | 'mastery' | 'social' | 'special'
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  points: number
  requirement: AchievementRequirement
  reward?: AchievementReward
}

export interface AchievementRequirement {
  type: 'sessions' | 'streak' | 'accuracy' | 'xp' | 'mastery' | 'speed' | 'games' | 'time'
  target: number
  condition?: any // Additional conditions
}

export interface AchievementReward {
  xp?: number
  badge?: string
  title?: string
  unlock?: string // Unlock special features
}

export interface UserAchievement {
  achievementId: string
  unlockedAt: Date
  progress: number
  claimed: boolean
}

// Achievement Definitions
export const ACHIEVEMENTS: Achievement[] = [
  // 🔥 Streak Achievements
  {
    id: 'streak_3',
    name: 'Getting Started',
    description: 'Complete training 3 days in a row',
    icon: '🔥',
    category: 'streak',
    tier: 'bronze',
    points: 50,
    requirement: { type: 'streak', target: 3 },
    reward: { xp: 100, badge: 'streak_bronze' }
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Complete training 7 days in a row',
    icon: '🔥',
    category: 'streak',
    tier: 'silver',
    points: 100,
    requirement: { type: 'streak', target: 7 },
    reward: { xp: 300, badge: 'streak_silver' }
  },
  {
    id: 'streak_30',
    name: 'Dedicated Student',
    description: 'Complete training 30 days in a row',
    icon: '🔥',
    category: 'streak',
    tier: 'gold',
    points: 500,
    requirement: { type: 'streak', target: 30 },
    reward: { xp: 1000, badge: 'streak_gold', title: 'Dedicated' }
  },
  {
    id: 'streak_100',
    name: 'Chess Addict',
    description: 'Complete training 100 days in a row',
    icon: '💎',
    category: 'streak',
    tier: 'diamond',
    points: 1000,
    requirement: { type: 'streak', target: 100 },
    reward: { xp: 5000, badge: 'streak_diamond', title: 'Grandmaster Trainee' }
  },

  // 🎯 Accuracy Achievements
  {
    id: 'accuracy_80',
    name: 'Sharp Mind',
    description: 'Complete a session with 80%+ accuracy',
    icon: '🎯',
    category: 'training',
    tier: 'bronze',
    points: 50,
    requirement: { type: 'accuracy', target: 80 }
  },
  {
    id: 'accuracy_90',
    name: 'Precision Player',
    description: 'Complete a session with 90%+ accuracy',
    icon: '🎯',
    category: 'training',
    tier: 'silver',
    points: 100,
    requirement: { type: 'accuracy', target: 90 }
  },
  {
    id: 'perfect_10',
    name: 'Perfection',
    description: 'Get 10/10 correct in a session',
    icon: '💯',
    category: 'training',
    tier: 'gold',
    points: 200,
    requirement: { type: 'accuracy', target: 100, condition: { minQuestions: 10 } },
    reward: { xp: 500, badge: 'perfect' }
  },

  // ⚡ Speed Achievements
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Answer 10 questions correctly in under 3 seconds each',
    icon: '⚡',
    category: 'training',
    tier: 'silver',
    points: 150,
    requirement: { type: 'speed', target: 3000, condition: { streak: 10 } }
  },
  {
    id: 'lightning_fast',
    name: 'Lightning Fast',
    description: 'Complete a blitz session with avg time < 5s per move',
    icon: '⚡',
    category: 'training',
    tier: 'gold',
    points: 300,
    requirement: { type: 'speed', target: 5000 },
    reward: { xp: 750, badge: 'speedster' }
  },

  // 👑 Mastery Achievements
  {
    id: 'opening_specialist',
    name: 'Opening Specialist',
    description: 'Reach 80% mastery in any opening',
    icon: '👑',
    category: 'mastery',
    tier: 'silver',
    points: 200,
    requirement: { type: 'mastery', target: 80 }
  },
  {
    id: 'opening_master',
    name: 'Opening Master',
    description: 'Reach 95% mastery in any opening',
    icon: '👑',
    category: 'mastery',
    tier: 'gold',
    points: 500,
    requirement: { type: 'mastery', target: 95 },
    reward: { xp: 1000, title: 'Master' }
  },
  {
    id: 'polyglot',
    name: 'Opening Polyglot',
    description: 'Reach 50%+ mastery in 10 different openings',
    icon: '🌟',
    category: 'mastery',
    tier: 'platinum',
    points: 1000,
    requirement: { type: 'mastery', target: 50, condition: { openings: 10 } }
  },

  // 📚 Volume Achievements
  {
    id: 'first_session',
    name: 'First Steps',
    description: 'Complete your first training session',
    icon: '🎯',
    category: 'training',
    tier: 'bronze',
    points: 25,
    requirement: { type: 'sessions', target: 1 },
    reward: { xp: 50 }
  },
  {
    id: 'sessions_10',
    name: 'Regular Trainer',
    description: 'Complete 10 training sessions',
    icon: '📚',
    category: 'training',
    tier: 'bronze',
    points: 100,
    requirement: { type: 'sessions', target: 10 }
  },
  {
    id: 'sessions_100',
    name: 'Century Club',
    description: 'Complete 100 training sessions',
    icon: '💪',
    category: 'training',
    tier: 'gold',
    points: 500,
    requirement: { type: 'sessions', target: 100 },
    reward: { xp: 2000, badge: 'centurion' }
  },

  // 🎉 Special Event Achievements
  {
    id: 'world_championship_2024',
    name: 'WC 2024 Enthusiast',
    description: 'Train during the World Championship 2024',
    icon: '🏆',
    category: 'special',
    tier: 'gold',
    points: 300,
    requirement: { type: 'time', target: 0, condition: { event: 'wc2024' } }
  },
  {
    id: 'new_year_2025',
    name: 'New Year Resolution',
    description: 'Start training in January 2025',
    icon: '🎊',
    category: 'special',
    tier: 'silver',
    points: 100,
    requirement: { type: 'time', target: 0, condition: { month: 1, year: 2025 } }
  },

  // 🌟 XP Milestones
  {
    id: 'xp_1000',
    name: 'Rising Star',
    description: 'Earn 1,000 XP',
    icon: '⭐',
    category: 'training',
    tier: 'bronze',
    points: 100,
    requirement: { type: 'xp', target: 1000 }
  },
  {
    id: 'xp_5000',
    name: 'Experienced',
    description: 'Earn 5,000 XP',
    icon: '⭐',
    category: 'training',
    tier: 'silver',
    points: 250,
    requirement: { type: 'xp', target: 5000 }
  },
  {
    id: 'xp_10000',
    name: 'Veteran',
    description: 'Earn 10,000 XP',
    icon: '⭐',
    category: 'training',
    tier: 'gold',
    points: 500,
    requirement: { type: 'xp', target: 10000 },
    reward: { badge: 'veteran', title: 'Veteran' }
  }
]

// Achievement Engine
export class AchievementEngine {
  // Check if user has unlocked an achievement
  static async checkAchievements(
    userId: string,
    context: {
      session?: any
      stats?: any
      timestamp?: Date
    }
  ): Promise<string[]> {
    const newAchievements: string[] = []
    
    // Get user's current achievements
    const userAchievements = await this.getUserAchievements(userId)
    const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId))
    
    // Check each achievement
    for (const achievement of ACHIEVEMENTS) {
      if (unlockedIds.has(achievement.id)) continue
      
      const unlocked = await this.checkRequirement(achievement, userId, context)
      if (unlocked) {
        newAchievements.push(achievement.id)
        await this.unlockAchievement(userId, achievement.id)
      }
    }
    
    return newAchievements
  }
  
  // Check specific requirement
  private static async checkRequirement(
    achievement: Achievement,
    userId: string,
    context: any
  ): Promise<boolean> {
    const { type, target, condition } = achievement.requirement
    
    switch (type) {
      case 'sessions':
        return context.stats?.totalSessions >= target
        
      case 'streak':
        return context.stats?.currentStreak >= target
        
      case 'accuracy':
        if (context.session) {
          const meetsAccuracy = context.session.accuracy >= target
          if (condition?.minQuestions) {
            return meetsAccuracy && context.session.attempts.length >= condition.minQuestions
          }
          return meetsAccuracy
        }
        return false
        
      case 'xp':
        return context.stats?.experience >= target
        
      case 'mastery':
        if (condition?.openings) {
          const masteryCount = context.stats?.openingStats.filter(
            (os: any) => os.mastery >= target
          ).length || 0
          return masteryCount >= condition.openings
        } else {
          return context.stats?.openingStats.some((os: any) => os.mastery >= target)
        }
        
      case 'speed':
        if (context.session && condition?.streak) {
          const fastMoves = context.session.attempts.filter(
            (a: any) => a.isCorrect && a.timeSpent <= target
          )
          return this.hasStreak(fastMoves, condition.streak)
        }
        return false
        
      case 'time':
        if (condition?.event === 'wc2024') {
          const now = context.timestamp || new Date()
          return now >= new Date('2024-11-01') && now <= new Date('2024-12-31')
        }
        if (condition?.month && condition?.year) {
          const now = context.timestamp || new Date()
          return now.getMonth() + 1 === condition.month && 
                 now.getFullYear() === condition.year
        }
        return false
        
      default:
        return false
    }
  }
  
  // Check if array has consecutive streak
  private static hasStreak(items: any[], targetStreak: number): boolean {
    let currentStreak = 0
    let maxStreak = 0
    
    for (let i = 0; i < items.length; i++) {
      if (items[i]) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    }
    
    return maxStreak >= targetStreak
  }
  
  // Get user's achievements
  private static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    // In production, fetch from database
    // For now, parse from stats JSON
    const stats = await prisma.trainingStats.findUnique({
      where: { userId }
    })
    
    if (!stats) return []
    
    try {
      return JSON.parse(stats.achievements)
    } catch {
      return []
    }
  }
  
  // Unlock achievement for user
  private static async unlockAchievement(userId: string, achievementId: string) {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId)
    if (!achievement) return
    
    // Update user stats
    const stats = await prisma.trainingStats.findUnique({
      where: { userId }
    })
    
    if (!stats) return
    
    const achievements = JSON.parse(stats.achievements || '[]')
    achievements.push({
      achievementId,
      unlockedAt: new Date(),
      progress: 100,
      claimed: false
    })
    
    // Apply rewards
    const updates: any = {
      achievements: JSON.stringify(achievements)
    }
    
    if (achievement.reward?.xp) {
      updates.experience = { increment: achievement.reward.xp }
    }
    
    await prisma.trainingStats.update({
      where: { userId },
      data: updates
    })
  }
  
  // Get progress for all achievements
  static async getAchievementProgress(userId: string): Promise<Map<string, number>> {
    const progress = new Map<string, number>()
    const stats = await prisma.trainingStats.findUnique({
      where: { userId },
      include: { openingStats: true }
    })
    
    if (!stats) return progress
    
    for (const achievement of ACHIEVEMENTS) {
      const { type, target } = achievement.requirement
      
      switch (type) {
        case 'sessions':
          progress.set(achievement.id, (stats.totalSessions / target) * 100)
          break
        case 'streak':
          progress.set(achievement.id, (stats.currentStreak / target) * 100)
          break
        case 'xp':
          progress.set(achievement.id, (stats.experience / target) * 100)
          break
        // Add more cases as needed
      }
    }
    
    return progress
  }
}