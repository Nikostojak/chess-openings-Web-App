import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📝 Received game data:', body)
    
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
      externalId,
      // 🆕 New elite fields
      isElite,
      isWorldChampionship,
      avgRating,
      tournament
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

    const game = await prisma.game.create({
      data: {
        date: new Date(date),
        opponent,
        result,
        opening,
        ecoCode: ecoCode || null,
        timeControl: timeControl || null,
        notes: notes || null,
        pgn: pgn || null,
        source: source || 'manual',
        externalId: externalId || null,
        userId: tempUserId,
        // 🆕 Elite fields
        isElite: isElite || false,
        isWorldChampionship: isWorldChampionship || false,
        avgRating: avgRating || null,
        tournament: tournament || null
      }
    })

    console.log('✅ Game created successfully:', game.id, 'ECO:', game.ecoCode)

    return NextResponse.json({ success: true, game }, { status: 201 })
  } catch (error) {
    console.error('❌ Detailed error creating game:', error)
    
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const ecoCode = searchParams.get('ecoCode')
    const filter = searchParams.get('filter') || 'all'
    const sort = searchParams.get('sort') || 'date'
    const limit = parseInt(searchParams.get('limit') || '10')
    
    console.log('🔍 Query params:', { ecoCode, filter, sort, limit })

    // Build where clause
    const where: Record<string, unknown> = {}
    
    // Filter by ECO code if provided
    if (ecoCode) {
      where.ecoCode = ecoCode
    }
    
    // Apply filter
    switch (filter) {
      case 'elite':
        where.isElite = true
        break
      case 'wc':
        where.isWorldChampionship = true
        break
      case 'all':
      default:
        // No additional filtering
        break
    }

    // Build orderBy clause
    let orderBy: Record<string, string> | Record<string, string>[] = []
    
    switch (sort) {
      case 'date':
        orderBy = { date: 'desc' }
        break
      case 'rating':
        // Sort by average rating (highest first), then by date
        orderBy = [
          { avgRating: 'desc' },
          { date: 'desc' }
        ]
        break
      case 'elite':
        // Sort elite games first, then world championship, then by date
        orderBy = [
          { isWorldChampionship: 'desc' },
          { isElite: 'desc' },
          { date: 'desc' }
        ]
        break
      default:
        orderBy = { date: 'desc' }
    }

    const games = await prisma.game.findMany({
      where,
      orderBy,
      take: limit,
      include: {
        openingRef: {
          select: {
            name: true,
            family: true
          }
        }
      }
    })

    console.log(`✅ Fetched ${games.length} games with filters:`, { ecoCode, filter, sort })

    return NextResponse.json({ games })
  } catch (error) {
    console.error('❌ Error fetching games:', error)
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    )
  }
}