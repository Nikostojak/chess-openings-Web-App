import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/db'
import { ecoParser } from '../../../lib/eco-parser'
import { UnknownTypedSql } from '@prisma/client/runtime/library'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') // A, B, C, D, E
    const family = searchParams.get('family')     // "Sicilian Defense"
    const search = searchParams.get('search')     // general search
    const popular = searchParams.get('popular')   // "true" for popular only
    const limit = parseInt(searchParams.get('limit') || '50')

    console.log('🔍 Openings API called with params:', {
      category, family, search, popular, limit
    })

   const whereClause: Record<string, unknown> = {}

    // Filter by ECO category
    if (category && ['A', 'B', 'C', 'D', 'E'].includes(category)) {
      whereClause.ecoCode = {
        startsWith: category
      }
    }

    // Filter by opening family
    if (family) {
      whereClause.family = {
        contains: family,
        mode: 'insensitive'
      }
    }

    // General search
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { family: { contains: search, mode: 'insensitive' } },
        { variation: { contains: search, mode: 'insensitive' } },
        { ecoCode: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Popular openings filter
    if (popular === 'true') {
      whereClause.popularity = {
        gt: 0
      }
    }

    const openings = await prisma.opening.findMany({
      where: whereClause,
      orderBy: popular === 'true' 
        ? { popularity: 'desc' }
        : { ecoCode: 'asc' },
      take: limit
    })

    console.log(`✅ Found ${openings.length} openings`)

    return NextResponse.json({ 
      openings,
      count: openings.length
    })

  } catch (error) {
    console.error('❌ Error fetching openings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch openings' },
      { status: 500 }
    )
  }
}

// POST endpoint for analyzing PGN and returning ECO classification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pgn, moves } = body

    console.log('🔍 ECO classification request:', { pgn: pgn?.substring(0, 50), moves })

    if (!pgn && !moves) {
      return NextResponse.json(
        { error: 'PGN or moves array required' },
        { status: 400 }
      )
    }

    let opening
    if (pgn) {
      opening = ecoParser.findByPgn(pgn)
    } else if (moves) {
      opening = ecoParser.findByMoves(moves)
    }

    if (!opening) {
      console.log('❌ No opening found for provided moves')
      return NextResponse.json({
        ecoCode: null,
        name: 'Unknown Opening',
        family: 'Unknown',
        classification: null
      })
    }

    console.log(`✅ Found opening: ${opening.ecoCode} - ${opening.name}`)

    // Get full database info
    const dbOpening = await prisma.opening.findUnique({
      where: { ecoCode: opening.ecoCode }
    })

    return NextResponse.json({
      ecoCode: opening.ecoCode,
      name: opening.name,
      family: opening.family,
      variation: opening.variation,
      subvariation: opening.subvariation,
      moves: opening.moves,
      fen: opening.fen,
      popularity: dbOpening?.popularity || 0,
      classification: dbOpening
    })

  } catch (error) {
    console.error('❌ Error classifying opening:', error)
    return NextResponse.json(
      { error: 'Failed to classify opening' },
      { status: 500 }
    )
  }
}