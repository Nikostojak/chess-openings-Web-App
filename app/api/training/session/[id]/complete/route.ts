// app/api/training/session/[id]/complete/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    // Update session as completed
    const session = await prisma.trainingSession.update({
      where: { id },
      data: { 
        completed: true,
        updatedAt: new Date()
      }
    })
    
    // Update user's total sessions count
    await prisma.trainingStats.update({
      where: { userId: session.userId },
      data: {
        totalSessions: { increment: 1 }
      }
    })
    
    return NextResponse.json({ 
      success: true,
      message: 'Session completed successfully'
    })
    
  } catch (error) {
    console.error('Error completing session:', error)
    return NextResponse.json(
      { error: 'Failed to complete session' },
      { status: 500 }
    )
  }
}