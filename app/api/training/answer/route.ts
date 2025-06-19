// app/api/training/answer/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      sessionId, 
      questionIndex, 
      userMove, 
      timeSpent,
      openingId,
      position,
      correctMove // This should come from server-side storage in production
    } = body
    
    // Validate answer
    const isCorrect = userMove === correctMove
    
    // Calculate points
    const basePoints = 100
    const timeBonus = Math.max(0, 10000 - timeSpent) / 100 // max 100 bonus points
    const points = isCorrect ? Math.round(basePoints + timeBonus) : 0
    
    // Update session
    const session = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
      include: { attempts: true }
    })
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
    
    // Calculate new streak
    const newStreak = isCorrect ? session.streak + 1 : 0
    const maxStreak = Math.max(session.maxStreak, newStreak)
    
    // Create attempt record
    const attempt = await prisma.trainingAttempt.create({
      data: {
        sessionId,
        openingId,
        position,
        correctMove,
        userMove,
        isCorrect,
        timeSpent,
        difficulty: 3, // TODO: Get from question
        hints: 0 // TODO: Track hint usage
      }
    })
    
    // Update session stats
    const totalAttempts = session.attempts.length + 1
    const correctAttempts = session.attempts.filter(a => a.isCorrect).length + (isCorrect ? 1 : 0)
    const accuracy = (correctAttempts / totalAttempts) * 100
    const newScore = session.score + points
    const newTotalTime = session.totalTime + Math.round(timeSpent / 1000)
    
    await prisma.trainingSession.update({
      where: { id: sessionId },
      data: {
        score: newScore,
        totalTime: newTotalTime,
        accuracy,
        streak: newStreak,
        maxStreak
      }
    })
    
    // Update user's opening-specific stats
    const userId = session.userId
    const stats = await prisma.trainingStats.upsert({
      where: { userId },
      create: {
        userId,
        totalSessions: 0,
        totalAttempts: 1,
        correctAttempts: isCorrect ? 1 : 0,
        totalTime: Math.round(timeSpent / 1000),
        experience: points
      },
      update: {
        totalAttempts: { increment: 1 },
        correctAttempts: { increment: isCorrect ? 1 : 0 },
        totalTime: { increment: Math.round(timeSpent / 1000) },
        experience: { increment: points }
      }
    })
    
    // Update opening-specific mastery
    await prisma.trainingOpeningStats.upsert({
      where: {
        statsId_openingId: {
          statsId: stats.id,
          openingId
        }
      },
      create: {
        statsId: stats.id,
        openingId,
        attempts: 1,
        correct: isCorrect ? 1 : 0,
        avgTime: timeSpent,
        mastery: isCorrect ? 10 : 0,
        lastSeen: new Date()
      },
      update: {
        attempts: { increment: 1 },
        correct: { increment: isCorrect ? 1 : 0 },
        avgTime: { increment: timeSpent }, // TODO: Calculate actual average
        mastery: { increment: isCorrect ? 5 : -2 },
        lastSeen: new Date()
      }
    })
    
    // Check for achievements
    const achievements = checkAchievements(stats, session, newStreak)
    
    return NextResponse.json({
      success: true,
      result: {
        isCorrect,
        points,
        streak: newStreak,
        totalScore: newScore,
        accuracy: accuracy.toFixed(1),
        feedback: isCorrect 
          ? getSuccessFeedback(timeSpent, newStreak)
          : `Not quite! The correct move was ${correctMove}`,
        achievements
      }
    })
    
  } catch (error) {
    console.error('Error processing answer:', error)
    return NextResponse.json(
      { error: 'Failed to process answer' },
      { status: 500 }
    )
  }
}

function getSuccessFeedback(timeSpent: number, streak: number): string {
  const timeSeconds = timeSpent / 1000
  
  if (timeSeconds < 3) return "Lightning fast! ⚡"
  if (timeSeconds < 5) return "Excellent speed! 🚀"
  if (streak >= 10) return `Incredible ${streak} streak! 🔥`
  if (streak >= 5) return `Great ${streak} move streak! 💪`
  
  const messages = [
    "Correct! Well done! ✓",
    "Perfect move! 👏",
    "Exactly right! 🎯",
    "You got it! 💯",
    "Spot on! ⭐"
  ]
  
  return messages[Math.floor(Math.random() * messages.length)]
}

function checkAchievements(stats: any, session: any, streak: number): string[] {
  const achievements: string[] = []
  
  // Streak achievements
  if (streak === 5) achievements.push('first_streak_5')
  if (streak === 10) achievements.push('first_streak_10')
  if (streak === 20) achievements.push('first_streak_20')
  
  // Experience milestones
  if (stats.experience >= 1000 && stats.experience - session.score < 1000) {
    achievements.push('xp_1000')
  }
  
  // Session score achievements
  if (session.score >= 1500) achievements.push('session_score_1500')
  
  // Accuracy achievements
  if (session.accuracy >= 90 && session.attempts.length >= 10) {
    achievements.push('accuracy_master')
  }
  
  return achievements
}