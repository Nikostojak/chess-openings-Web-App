// lib/spaced-repetition.ts

import { prisma } from './db'

export interface RepetitionItem {
  openingId: string
  userId: string
  lastSeen: Date
  nextReview: Date
  interval: number // days
  easeFactor: number // 1.3 - 2.5
  repetitions: number
  lapses: number // number of times forgotten
}

export class SpacedRepetition {
  // SuperMemo SM-2 algorithm implementation
  private static readonly MIN_EASE = 1.3
  private static readonly MAX_EASE = 2.5
  private static readonly INITIAL_EASE = 2.5
  
  // Calculate next review date based on performance
  static calculateNextReview(
    item: RepetitionItem,
    performance: 'again' | 'hard' | 'good' | 'easy'
  ): RepetitionItem {
    let { interval, easeFactor, repetitions, lapses } = item
    
    // Performance quality mapping (0-5 scale)
    const qualityMap = {
      'again': 0,  // Complete failure
      'hard': 2,   // Difficult but correct
      'good': 3,   // Normal difficulty
      'easy': 5    // Too easy
    }
    
    const quality = qualityMap[performance]
    
    // Update ease factor
    easeFactor = this.calculateEaseFactor(easeFactor, quality)
    
    // Calculate new interval
    if (quality < 3) {
      // Failed or difficult - reset
      interval = 1
      repetitions = 0
      if (quality === 0) {
        lapses++
      }
    } else {
      // Successful recall
      if (repetitions === 0) {
        interval = 1
      } else if (repetitions === 1) {
        interval = 6
      } else {
        interval = Math.round(interval * easeFactor)
      }
      repetitions++
    }
    
    // Apply lapse penalty
    if (lapses > 0) {
      interval = Math.max(1, Math.round(interval * Math.pow(0.8, lapses)))
    }
    
    // Calculate next review date
    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + interval)
    
    return {
      ...item,
      interval,
      easeFactor,
      repetitions,
      lapses,
      lastSeen: new Date(),
      nextReview
    }
  }
  
  // Calculate new ease factor
  private static calculateEaseFactor(oldEase: number, quality: number): number {
    const newEase = oldEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    return Math.max(this.MIN_EASE, Math.min(this.MAX_EASE, newEase))
  }
  
  // Get items due for review
  static async getItemsDueForReview(
    userId: string,
    limit: number = 20
  ): Promise<RepetitionItem[]> {
    const now = new Date()
    
    // In production, query from database
    // For now, calculate based on training stats
    const stats = await prisma.trainingOpeningStats.findMany({
      where: {
        stats: { userId },
        lastSeen: { not: null }
      },
      include: {
        opening: true
      },
      orderBy: {
        lastSeen: 'asc'
      }
    })
    
    const dueItems: RepetitionItem[] = []
    
    for (const stat of stats) {
      const item = this.createRepetitionItem(stat, userId)
      if (item.nextReview <= now) {
        dueItems.push(item)
      }
    }
    
    // Sort by priority (overdue items first)
    dueItems.sort((a, b) => {
      const aDaysOverdue = this.daysBetween(a.nextReview, now)
      const bDaysOverdue = this.daysBetween(b.nextReview, now)
      return bDaysOverdue - aDaysOverdue
    })
    
    return dueItems.slice(0, limit)
  }
  
  // Create repetition item from stats
  private static createRepetitionItem(stat: any, userId: string): RepetitionItem {
    const lastSeen = stat.lastSeen || new Date()
    const accuracy = stat.attempts > 0 ? stat.correct / stat.attempts : 0
    
    // Estimate ease factor from historical performance
    let easeFactor = this.INITIAL_EASE
    if (accuracy < 0.6) easeFactor = 1.5
    else if (accuracy < 0.8) easeFactor = 2.0
    else if (accuracy > 0.95) easeFactor = 2.5
    
    // Estimate interval based on mastery
    let interval = 1
    if (stat.mastery > 80) interval = 21
    else if (stat.mastery > 60) interval = 14
    else if (stat.mastery > 40) interval = 7
    else if (stat.mastery > 20) interval = 3
    
    const nextReview = new Date(lastSeen)
    nextReview.setDate(nextReview.getDate() + interval)
    
    return {
      openingId: stat.openingId,
      userId,
      lastSeen,
      nextReview,
      interval,
      easeFactor,
      repetitions: Math.floor(stat.mastery / 20), // Estimate
      lapses: Math.max(0, stat.attempts - stat.correct)
    }
  }
  
  // Helper: Days between dates
  private static daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000
    return Math.floor((date2.getTime() - date1.getTime()) / oneDay)
  }
  
  // Get learning statistics
  static getLearningStats(items: RepetitionItem[]): {
    totalItems: number
    dueToday: number
    learning: number
    young: number
    mature: number
  } {
    const now = new Date()
    
    return {
      totalItems: items.length,
      dueToday: items.filter(i => i.nextReview <= now).length,
      learning: items.filter(i => i.repetitions < 3).length,
      young: items.filter(i => i.repetitions >= 3 && i.interval < 21).length,
      mature: items.filter(i => i.interval >= 21).length
    }
  }
  
  // Optimize review schedule
  static optimizeSchedule(
    items: RepetitionItem[],
    dailyLimit: number = 20
  ): Map<string, RepetitionItem[]> {
    const schedule = new Map<string, RepetitionItem[]>()
    const today = new Date()
    
    // Sort by urgency
    items.sort((a, b) => {
      const aOverdue = this.daysBetween(a.nextReview, today)
      const bOverdue = this.daysBetween(b.nextReview, today)
      return bOverdue - aOverdue
    })
    
    // Distribute items across days
    let currentDay = new Date(today)
    let dayKey = currentDay.toISOString().split('T')[0]
    let dayItems: RepetitionItem[] = []
    
    for (const item of items) {
      if (dayItems.length >= dailyLimit) {
        schedule.set(dayKey, [...dayItems])
        dayItems = []
        currentDay.setDate(currentDay.getDate() + 1)
        dayKey = currentDay.toISOString().split('T')[0]
      }
      dayItems.push(item)
    }
    
    if (dayItems.length > 0) {
      schedule.set(dayKey, dayItems)
    }
    
    return schedule
  }
}