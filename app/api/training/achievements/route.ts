// app/api/training/achievements/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { ACHIEVEMENTS, AchievementEngine } from '@/lib/achievements'
import { prisma } from '@/lib/db'

// GET - Get user's achievements and progress
export async function GET(request: NextRequest) {
  try {
    // TODO: Get real user ID from auth
    const userId = 'temp-user-123'
    
    const stats = await prisma.trainingStats.findUnique({
      where: { userId }
    })
    
    if (!stats) {
      return NextResponse.json({
        achievements: [],
        progress: {},
        totalPoints: 0
      })
    }
    
    // Parse achievements from JSON
    let userAchievements = []
    try {
      userAchievements = JSON.parse(stats.achievements || '[]')
    } catch {
      userAchievements = []
    }
    
    // Get progress for all achievements
    const progress = await AchievementEngine.getAchievementProgress(userId)
    
    // Format response
    const achievementsWithDetails = ACHIEVEMENTS.map(achievement => {
      const userAch = userAchievements.find((ua: any) => ua.achievementId === achievement.id)
      const progressValue = progress.get(achievement.id) || 0
      
      return {
        ...achievement,
        unlocked: !!userAch,
        unlockedAt: userAch?.unlockedAt,
        progress: Math.min(100, progressValue),
        claimed: userAch?.claimed || false
      }
    })
    
    // Calculate total points
    const totalPoints = achievementsWithDetails
      .filter(a => a.unlocked)
      .reduce((sum, a) => sum + a.points, 0)
    
    // Group by category
    const byCategory = achievementsWithDetails.reduce((acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = []
      }
      acc[achievement.category].push(achievement)
      return acc
    }, {} as Record<string, typeof achievementsWithDetails>)
    
    return NextResponse.json({
      achievements: achievementsWithDetails,
      byCategory,
      totalPoints,
      stats: {
        total: ACHIEVEMENTS.length,
        unlocked: achievementsWithDetails.filter(a => a.unlocked).length,
        bronze: achievementsWithDetails.filter(a => a.unlocked && a.tier === 'bronze').length,
        silver: achievementsWithDetails.filter(a => a.unlocked && a.tier === 'silver').length,
        gold: achievementsWithDetails.filter(a => a.unlocked && a.tier === 'gold').length,
        platinum: achievementsWithDetails.filter(a => a.unlocked && a.tier === 'platinum').length,
        diamond: achievementsWithDetails.filter(a => a.unlocked && a.tier === 'diamond').length
      }
    })
    
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    )
  }
}

// POST - Claim achievement rewards
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { achievementId } = body
    
    if (!achievementId) {
      return NextResponse.json(
        { error: 'Achievement ID required' },
        { status: 400 }
      )
    }
    
    // TODO: Get real user ID from auth
    const userId = 'temp-user-123'
    
    const stats = await prisma.trainingStats.findUnique({
      where: { userId }
    })
    
    if (!stats) {
      return NextResponse.json(
        { error: 'User stats not found' },
        { status: 404 }
      )
    }
    
    // Parse achievements
    let achievements = []
    try {
      achievements = JSON.parse(stats.achievements || '[]')
    } catch {
      achievements = []
    }
    
    // Find achievement
    const userAch = achievements.find((a: any) => a.achievementId === achievementId)
    if (!userAch) {
      return NextResponse.json(
        { error: 'Achievement not unlocked' },
        { status: 400 }
      )
    }
    
    if (userAch.claimed) {
      return NextResponse.json(
        { error: 'Rewards already claimed' },
        { status: 400 }
      )
    }
    
    // Mark as claimed
    userAch.claimed = true
    
    // Update database
    await prisma.trainingStats.update({
      where: { userId },
      data: {
        achievements: JSON.stringify(achievements)
      }
    })
    
    // Get achievement details
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId)
    
    return NextResponse.json({
      success: true,
      message: 'Rewards claimed successfully',
      reward: achievement?.reward
    })
    
  } catch (error) {
    console.error('Error claiming achievement:', error)
    return NextResponse.json(
      { error: 'Failed to claim achievement' },
      { status: 500 }
    )
  }
}