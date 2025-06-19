// app/api/training/session/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { TrainingEngine, TrainingConfig } from '@/lib/training-engine'

// POST - Start new training session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mode = 'blitz', difficulty = 'medium' } = body
    
    // TODO: Get real user ID from auth
    const userId = 'temp-user-123'
    
    // Configuration based on mode
    const configs: Record<string, TrainingConfig> = {
      blitz: {
        mode: 'blitz',
        timePerMove: 10,
        questionsPerSession: 10,
        difficultyRange: difficulty === 'easy' ? [1, 2] : difficulty === 'hard' ? [3, 5] : [2, 4]
      },
      rapid: {
        mode: 'rapid',
        timePerMove: 30,
        questionsPerSession: 15,
        difficultyRange: difficulty === 'easy' ? [1, 3] : difficulty === 'hard' ? [3, 5] : [2, 4]
      },
      puzzle: {
        mode: 'puzzle',
        timePerMove: 60,
        questionsPerSession: 5,
        difficultyRange: [3, 5]
      }
    }
    
    const config = configs[mode] || configs.blitz
    
    // Generate questions
    const engine = new TrainingEngine()
    const questions = await engine.generateSession(userId, config)
    
    // Create session in database
    const session = await prisma.trainingSession.create({
      data: {
        userId,
        mode,
        score: 0,
        totalTime: 0,
        accuracy: 0,
        streak: 0,
        maxStreak: 0,
        completed: false
      }
    })
    
    // Store questions in cache/session (for now, return them)
    // In production, use Redis or similar
    
    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        mode: session.mode,
        questionsCount: questions.length,
        timePerMove: config.timePerMove
      },
      questions: questions.map((q, index) => ({
        index,
        position: q.position,
        openingName: q.openingName,
        moveNumber: q.moveNumber,
        difficulty: q.difficulty,
        hint: q.hint,
        choices: [...q.alternatives, q.correctMove].sort(() => Math.random() - 0.5)
      })),
      // Store correct answers separately (don't send to client yet)
      _answers: questions.map(q => ({ id: q.id, correct: q.correctMove }))
    })
  } catch (error) {
    console.error('Error creating training session:', error)
    return NextResponse.json(
      { error: 'Failed to create training session' },
      { status: 500 }
    )
  }
}

// GET - Get session stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }
    
    const session = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
      include: {
        attempts: {
          include: {
            opening: true
          }
        }
      }
    })
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    )
  }
}