// app/api/training/stats/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // TODO: Get real user ID from auth
    const userId = 'temp-user-123'
    
    const stats = await prisma.trainingStats.findUnique({
      where: { userId },
      include: {
        openingStats: {
          include: {
            opening: true
          },
          orderBy: {
            mastery: 'desc'
          },
          take: 10
        }
      }
    })
    
    if (!stats) {
      // Create default stats if don't exist
      const newStats = await prisma.trainingStats.create({
        data: {
          userId,
          totalSessions: 0,
          totalAttempts: 0,
          correctAttempts: 0,
          totalTime: 0,
          currentStreak: 0,
          longestStreak: 0,
          experience: 0,
          level: 1,
          achievements: '[]'
        }
      })
      
      return NextResponse.json({ 
        stats: newStats,
        exists: false 
      })
    }
    
    return NextResponse.json({ 
      stats,
      exists: true 
    })
    
  } catch (error) {
    console.error('Error fetching training stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch training stats' },
      { status: 500 }
    )
  }
}