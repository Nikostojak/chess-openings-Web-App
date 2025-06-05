import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/db'


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, opponent, result, opening, timeControl, notes } = body

    // Za sada koristimo temp user - kasnije ćemo dodati pravi auth
    const tempUserId = 'temp-user-123'

    const game = await prisma.game.create({
      data: {
        date: new Date(date),
        opponent,
        result,
        opening,
        timeControl: timeControl || null,
        notes: notes || null,
        userId: tempUserId
      }
    })

    return NextResponse.json({ success: true, game }, { status: 201 })
  } catch (error) {
    console.error('Error creating game:', error)
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      orderBy: { date: 'desc' },
      take: 10
    })

    return NextResponse.json({ games })
  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    )
  }
}