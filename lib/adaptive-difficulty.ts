// lib/adaptive-difficulty.ts

import { prisma } from './db'

export interface PlayerProfile {
  userId: string
  skillLevel: number // 0-100
  recentPerformance: PerformanceMetric[]
  strengths: string[] // Opening IDs where player excels
  weaknesses: string[] // Opening IDs that need work
  preferredDifficulty: number // 1-5
  adaptiveSettings: {
    enabled: boolean
    sensitivity: number // How quickly to adjust (0.1 - 1.0)
    minDifficulty: number
    maxDifficulty: number
  }
}

export interface PerformanceMetric {
  timestamp: Date
  accuracy: number
  avgTimePerMove: number
  difficulty: number
  openingId: string
}

export class AdaptiveDifficulty {
  private static readonly WINDOW_SIZE = 10 // Last N attempts
  private static readonly TARGET_ACCURACY = 0.75 // 75% target
  private static readonly TARGET_TIME_RATIO = 0.6 // Use 60% of available time
  
  // Calculate optimal difficulty for player
  static async calculateOptimalDifficulty(
    userId: string,
    openingId?: string
  ): Promise<number> {
    const profile = await this.getPlayerProfile(userId)
    
    if (!profile.adaptiveSettings.enabled) {
      return profile.preferredDifficulty
    }
    
    // Get recent performance
    const recentMetrics = openingId
      ? profile.recentPerformance.filter(m => m.openingId === openingId)
      : profile.recentPerformance
    
    if (recentMetrics.length === 0) {
      return profile.preferredDifficulty
    }
    
    // Calculate performance indicators
    const avgAccuracy = this.calculateAverage(recentMetrics.map(m => m.accuracy))
    const avgTimeRatio = this.calculateAverage(recentMetrics.map(m => m.avgTimePerMove))
    const currentDifficulty = this.calculateAverage(recentMetrics.map(m => m.difficulty))
    
    // Determine adjustment
    let adjustment = 0
    
    // Accuracy-based adjustment
    if (avgAccuracy > this.TARGET_ACCURACY + 0.1) {
      adjustment += 0.5 // Too easy, increase difficulty
    } else if (avgAccuracy < this.TARGET_ACCURACY - 0.1) {
      adjustment -= 0.5 // Too hard, decrease difficulty
    }
    
    // Time-based adjustment
    if (avgTimeRatio < this.TARGET_TIME_RATIO - 0.2) {
      adjustment += 0.3 // Answering too quickly, might be too easy
    } else if (avgTimeRatio > this.TARGET_TIME_RATIO + 0.2) {
      adjustment -= 0.3 // Taking too long, might be too hard
    }
    
    // Apply sensitivity
    adjustment *= profile.adaptiveSettings.sensitivity
    
    // Calculate new difficulty
    let newDifficulty = currentDifficulty + adjustment
    
    // Apply bounds
    newDifficulty = Math.max(
      profile.adaptiveSettings.minDifficulty,
      Math.min(profile.adaptiveSettings.maxDifficulty, newDifficulty)
    )
    
    // Round to nearest 0.5
    return Math.round(newDifficulty * 2) / 2
  }
  
  // Update player profile after session
  static async updatePlayerProfile(
    userId: string,
    sessionResults: {
      attempts: Array<{
        openingId: string
        isCorrect: boolean
        timeSpent: number
        difficulty: number
      }>
      mode: string
    }
  ): Promise<PlayerProfile> {
    const profile = await this.getPlayerProfile(userId)
    
    // Calculate session metrics
    const sessionAccuracy = sessionResults.attempts.filter(a => a.isCorrect).length / 
                           sessionResults.attempts.length
    
    const avgTimePerMove = sessionResults.attempts.reduce((sum, a) => sum + a.timeSpent, 0) / 
                          sessionResults.attempts.length / 1000 // Convert to seconds
    
    // Group by opening
    const openingPerformance = new Map<string, { correct: number, total: number }>()
    
    for (const attempt of sessionResults.attempts) {
      const perf = openingPerformance.get(attempt.openingId) || { correct: 0, total: 0 }
      perf.total++
      if (attempt.isCorrect) perf.correct++
      openingPerformance.set(attempt.openingId, perf)
    }
    
    // Update recent performance
    const newMetrics: PerformanceMetric[] = Array.from(openingPerformance.entries()).map(
      ([openingId, perf]) => ({
        timestamp: new Date(),
        accuracy: perf.correct / perf.total,
        avgTimePerMove,
        difficulty: this.calculateAverage(
          sessionResults.attempts
            .filter(a => a.openingId === openingId)
            .map(a => a.difficulty)
        ),
        openingId
      })
    )
    
    profile.recentPerformance = [
      ...newMetrics,
      ...profile.recentPerformance
    ].slice(0, this.WINDOW_SIZE * 3) // Keep more history
    
    // Update skill level (ELO-like system)
    const expectedScore = 1 / (1 + Math.pow(10, (profile.skillLevel - 50) / 20))
    const actualScore = sessionAccuracy
    const k = 32 // K-factor
    
    profile.skillLevel = Math.max(
      0,
      Math.min(100, profile.skillLevel + k * (actualScore - expectedScore))
    )
    
    // Update strengths and weaknesses
    const openingStats = this.calculateOpeningStats(profile.recentPerformance)
    
    profile.strengths = Array.from(openingStats.entries())
      .filter(([_, stats]) => stats.accuracy > 0.8 && stats.count >= 3)
      .map(([openingId]) => openingId)
      .slice(0, 5)
    
    profile.weaknesses = Array.from(openingStats.entries())
      .filter(([_, stats]) => stats.accuracy < 0.6 && stats.count >= 3)
      .map(([openingId]) => openingId)
      .slice(0, 5)
    
    // Save profile (in production, save to database)
    await this.savePlayerProfile(profile)
    
    return profile
  }
  
  // Get or create player profile
  private static async getPlayerProfile(userId: string): Promise<PlayerProfile> {
    // In production, fetch from database
    // For now, create default profile
    
    const stats = await prisma.trainingStats.findUnique({
      where: { userId },
      include: {
        openingStats: {
          orderBy: { lastSeen: 'desc' },
          take: 20
        }
      }
    })
    
    // Convert stats to performance metrics
    const recentPerformance: PerformanceMetric[] = stats?.openingStats.map(os => ({
      timestamp: os.lastSeen || new Date(),
      accuracy: os.attempts > 0 ? os.correct / os.attempts : 0,
      avgTimePerMove: os.avgTime / 1000,
      difficulty: Math.ceil(os.mastery / 20), // Estimate difficulty from mastery
      openingId: os.openingId
    })) || []
    
    return {
      userId,
      skillLevel: stats ? Math.min(100, stats.level * 10) : 50,
      recentPerformance,
      strengths: [],
      weaknesses: [],
      preferredDifficulty: 3,
      adaptiveSettings: {
        enabled: true,
        sensitivity: 0.5,
        minDifficulty: 1,
        maxDifficulty: 5
      }
    }
  }
  
  // Save player profile
  private static async savePlayerProfile(profile: PlayerProfile): Promise<void> {
    // In production, save to database
    // For now, just log
    console.log('Saving player profile:', profile)
  }
  
  // Helper: Calculate average
  private static calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length
  }
  
  // Helper: Calculate opening statistics
  private static calculateOpeningStats(
    metrics: PerformanceMetric[]
  ): Map<string, { accuracy: number, count: number }> {
    const stats = new Map<string, { correct: number, total: number }>()
    
    for (const metric of metrics) {
      const stat = stats.get(metric.openingId) || { correct: 0, total: 0 }
      stat.total++
      stat.correct += metric.accuracy
      stats.set(metric.openingId, stat)
    }
    
    const result = new Map<string, { accuracy: number, count: number }>()
    
    for (const [openingId, stat] of stats.entries()) {
      result.set(openingId, {
        accuracy: stat.correct / stat.total,
        count: stat.total
      })
    }
    
    return result
  }
  
  // Get difficulty recommendation with explanation
  static async getDifficultyRecommendation(
    userId: string
  ): Promise<{
    recommended: number
    reason: string
    stats: {
      currentSkill: number
      recentAccuracy: number
      trend: 'improving' | 'stable' | 'declining'
    }
  }> {
    const profile = await this.getPlayerProfile(userId)
    const optimalDifficulty = await this.calculateOptimalDifficulty(userId)
    
    // Calculate recent accuracy
    const recentAccuracy = profile.recentPerformance.length > 0
      ? this.calculateAverage(profile.recentPerformance.slice(0, 5).map(m => m.accuracy))
      : 0.75
    
    // Determine trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable'
    if (profile.recentPerformance.length >= 5) {
      const oldAccuracy = this.calculateAverage(
        profile.recentPerformance.slice(-5).map(m => m.accuracy)
      )
      const newAccuracy = this.calculateAverage(
        profile.recentPerformance.slice(0, 5).map(m => m.accuracy)
      )
      
      if (newAccuracy > oldAccuracy + 0.1) trend = 'improving'
      else if (newAccuracy < oldAccuracy - 0.1) trend = 'declining'
    }
    
    // Generate reason
    let reason = ''
    if (trend === 'improving') {
      reason = 'You\'re improving! Time to challenge yourself with harder questions.'
    } else if (trend === 'declining') {
      reason = 'Let\'s focus on building confidence with slightly easier questions.'
    } else if (recentAccuracy > 0.85) {
      reason = 'You\'re mastering this level! Ready for a bigger challenge?'
    } else if (recentAccuracy < 0.65) {
      reason = 'Let\'s dial it back a bit to build a stronger foundation.'
    } else {
      reason = 'This difficulty level seems perfect for your current skill.'
    }
    
    return {
      recommended: optimalDifficulty,
      reason,
      stats: {
        currentSkill: profile.skillLevel,
        recentAccuracy: recentAccuracy * 100,
        trend
      }
    }
  }
}