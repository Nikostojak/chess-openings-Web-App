import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📝 Received game data:', body) // Debug log
    
    // 🔧 AŽURIRANO: Dodano ecoCode u destructuring
    const { 
      date, 
      opponent, 
      result, 
      opening, 
      ecoCode,        
      timeControl, 
      notes, 
      pgn, 
      source, 
      externalId 
    } = body

    // Validate required fields
    if (!date || !opponent || !result || !opening) {
      return NextResponse.json(
        { error: 'Missing required fields: date, opponent, result, opening' },
        { status: 400 }
      )
    }

    // Za sada koristim temp user - kasnije ću dodati pravi auth
    const tempUserId = 'temp-user-123'

    console.log('🔧 Creating game with data:', {
      date: new Date(date),
      opponent,
      result,
      opening,
      ecoCode: ecoCode || null,  // 🆕 NOVO POLJE
      timeControl: timeControl || null,
      notes: notes || null,
      pgn: pgn || null,
      source: source || 'manual',
      externalId: externalId || null,
      userId: tempUserId
    })

    const game = await prisma.game.create({
      data: {
        date: new Date(date),
        opponent,
        result,
        opening,
        ecoCode: ecoCode || null,     // 🆕 NOVO POLJE u bazi
        timeControl: timeControl || null,
        notes: notes || null,
        pgn: pgn || null,
        source: source || 'manual',
        externalId: externalId || null,
        userId: tempUserId
      }
    })

    console.log('✅ Game created successfully:', game.id, 'ECO:', game.ecoCode)

    return NextResponse.json({ success: true, game }, { status: 201 })
  } catch (error) {
    console.error('❌ Detailed error creating game:', error)
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create game',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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

    console.log(`✅ Fetched ${games.length} games`)

    return NextResponse.json({ games })
  } catch (error) {
    console.error('❌ Error fetching games:', error)
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    )
  }
}