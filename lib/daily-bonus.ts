// lib/daily-bonus.ts

import { prisma } from './db'
import { AchievementEngine } from './achievements'

export interface DailyBonus {
  day: number
  reward: {
    xp: number
    coins?: number
    item?: string
    description: string
  }
  milestone?: boolean
}

export const DAILY_BONUSES: DailyBonus[] = [
  { day: 1, reward: { xp: 50, description: 'Welcome back!' } },
  { day: 2, reward: { xp: 75, description: 'Keep it up!' } },
  { day: 3, reward: { xp: 100, description: '3 day streak!' } },
  { day: 4, reward: { xp: 125, description: 'Dedicated learner!' } },
  { day: 5, reward: { xp: 150, description: 'High five! 🖐️' } },
  { day: 6, reward: { xp: 175, description: 'Almost a week!' } },
  { 
    day: 7, 
    reward: { xp: 300, coins: 100, description: 'Week warrior! 🏆' },
    milestone: true 
  },
  { day: 8, reward: { xp: 100, description: 'New week, new goals!' } },
  { day: 9, reward: { xp: 125, description: 'Consistency pays!' } },
  { day: 10, reward: { xp: 150, description: 'Double digits!' } },
  { day: 11, reward: { xp: 175, description: 'Unstoppable!' } },
  { day: 12, reward: { xp: 200, description: 'Chess dedication!' } },
  { day: 13, reward: { xp: 225, description: 'Lucky 13! 🍀' } },
  { 
    day: 14, 
    reward: { xp: 500, coins: 200, description: 'Two weeks strong! 💪' },
    milestone: true 
  },
  { day: 15, reward: { xp: 150, description: 'Halfway to legend!' } },
  { day: 16, reward: { xp: 175, description: 'Sweet 16!' } },
  { day: 17, reward: { xp: 200, description: 'Pro dedication!' } },
  { day: 18, reward: { xp: 225, description: 'Almost there!' } },
  { day: 19, reward: { xp: 250, description: 'One more push!' } },
  { day: 20, reward: { xp: 275, description: '20 days! 🎯' } },
  { 
    day: 21, 
    reward: { xp: 750, coins: 300, description: '3 weeks! You\'re a legend! 🌟' },
    milestone: true 
  },
  { day: 22, reward: { xp: 200, description: 'Keep the streak alive!' } },
  { day: 23, reward: { xp: 225, description: 'Impressive dedication!' } },
  { day: 24, reward: { xp: 250, description: '24/7 chess mind!' } },
  { day: 25, reward: { xp: 275, description: 'Quarter century!' } },
  { day: 26, reward: { xp: 300, description: 'Marathon runner!' } },
  { day: 27, reward: { xp: 325, description: 'Almost a month!' } },
  { 
    day: 28, 
    reward: { xp: 1000, coins: 500, item: 'special_badge', description: '4 weeks! True champion! 👑' },
    milestone: true 
  },
  { day: 29, reward: { xp: 350, description: 'One more day!' } },
  { 
    day: 30, 
    reward: { xp: 2000, coins: 1000, item: 'monthly_title', description: 'MONTHLY MASTER! 🏆👑🌟' },
    milestone: true 
  }
]

// Daily Bonus Manager
export class DailyBonusManager {
  static async claimDailyBonus(userId: string): Promise<{
    success: boolean
    reward?: DailyBonus['reward']
    currentStreak: number
    nextBonusIn?: number // hours until next bonus
  }> {
    const stats = await prisma.trainingStats.findUnique({
      where: { userId }
    })
    
    if (!stats) {
      // Create stats if doesn't exist
      await prisma.trainingStats.create({
        data: { userId }
      })
      return this.claimDailyBonus(userId)
    }
    
    const now = new Date()
    const lastClaim = stats.lastTraining
    
    // Check if already claimed today
    if (lastClaim && this.isSameDay(lastClaim, now)) {
      const hoursUntilNext = this.hoursUntilNextDay(now)
      return {
        success: false,
        currentStreak: stats.currentStreak,
        nextBonusIn: hoursUntilNext
      }
    }
    
    // Check if streak should reset
    let newStreak = stats.currentStreak
    if (lastClaim) {
      const daysSinceLastClaim = this.daysBetween(lastClaim, now)
      if (daysSinceLastClaim === 1) {
        // Continue streak
        newStreak++
      } else if (daysSinceLastClaim > 1) {
        // Reset streak
        newStreak = 1
      }
    } else {
      // First claim
      newStreak = 1
    }
    
    // Get reward for current streak day
    const bonusDay = ((newStreak - 1) % 30) + 1 // Loop after 30 days
    const bonus = DAILY_BONUSES.find(b => b.day === bonusDay) || DAILY_BONUSES[0]
    
    // Apply rewards
    await prisma.trainingStats.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(stats.longestStreak, newStreak),
        lastTraining: now,
        experience: { increment: bonus.reward.xp }
      }
    })
    
    // Check streak achievements
    await AchievementEngine.checkAchievements(userId, {
      stats: { ...stats, currentStreak: newStreak }
    })
    
    return {
      success: true,
      reward: bonus.reward,
      currentStreak: newStreak
    }
  }
  
  // Helper: Check if two dates are on the same day
  private static isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString()
  }
  
  // Helper: Calculate days between dates
  private static daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000
    const diffTime = Math.abs(date2.getTime() - date1.getTime())
    return Math.floor(diffTime / oneDay)
  }
  
  // Helper: Hours until next day
  private static hoursUntilNextDay(now: Date): number {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    const diff = tomorrow.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60))
  }
  
  // Get upcoming bonuses preview
  static getUpcomingBonuses(currentStreak: number, days: number = 7): DailyBonus[] {
    const upcoming: DailyBonus[] = []
    
    for (let i = 1; i <= days; i++) {
      const futureStreak = currentStreak + i
      const bonusDay = ((futureStreak - 1) % 30) + 1
      const bonus = DAILY_BONUSES.find(b => b.day === bonusDay) || DAILY_BONUSES[0]
      upcoming.push(bonus)
    }
    
    return upcoming
  }
}