// app/api/training/daily-bonus/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { DailyBonusManager } from '@/lib/daily-bonus'
import { prisma } from '@/lib/db'

// GET - Check daily bonus status
export async function GET(request: NextRequest) {
  try {
    // TODO: Get real user ID from auth
    const userId = 'temp-user-123'
    
    const stats = await prisma.trainingStats.findUnique({
      where: { userId }
    })
    
    if (!stats) {
      return NextResponse.json({
        claimedToday: false,
        currentStreak: 0,
        nextBonusIn: 0
      })
    }
    
    const lastClaim = stats.lastTraining
    const now = new Date()
    
    // Check if claimed today
    const claimedToday = lastClaim ? 
      lastClaim.toDateString() === now.toDateString() : false
    
    // Calculate hours until next bonus
    let nextBonusIn = 0
    if (claimedToday && lastClaim) {
      const tomorrow = new Date(lastClaim)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      
      const hoursUntil = Math.ceil((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60))
      nextBonusIn = Math.max(0, hoursUntil)
    }
    
    return NextResponse.json({
      claimedToday,
      currentStreak: stats.currentStreak,
      nextBonusIn,
      lastClaim: lastClaim?.toISOString()
    })
    
  } catch (error) {
    console.error('Error checking daily bonus:', error)
    return NextResponse.json(
      { error: 'Failed to check daily bonus' },
      { status: 500 }
    )
  }
}

// POST - Claim daily bonus
export async function POST(request: NextRequest) {
  try {
    // TODO: Get real user ID from auth
    const userId = 'temp-user-123'
    
    const result = await DailyBonusManager.claimDailyBonus(userId)
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: 'Already claimed today',
        nextBonusIn: result.nextBonusIn
      })
    }
    
    return NextResponse.json({
      success: true,
      reward: result.reward,
      currentStreak: result.currentStreak,
      message: `Daily bonus claimed! ${result.reward?.description || ''}`
    })
    
  } catch (error) {
    console.error('Error claiming daily bonus:', error)
    return NextResponse.json(
      { error: 'Failed to claim daily bonus' },
      { status: 500 }
    )
  }
}