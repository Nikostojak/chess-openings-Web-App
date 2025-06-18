import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/db'
import { ecoParser } from '../../../lib/eco-parser'

// Define proper types for Prisma where clause
type PrismaWhereClause = {
  ecoCode?: { startsWith: string }
  family?: { contains: string, mode: 'insensitive' }
  OR?: Array<{
    name?: { contains: string, mode: 'insensitive' }
    family?: { contains: string, mode: 'insensitive' }
    variation?: { contains: string, mode: 'insensitive' }
    ecoCode?: { contains: string, mode: 'insensitive' }
    AND?: Array<{
      name?: { contains: string, mode: 'insensitive' }
      family?: { contains: string, mode: 'insensitive' }
      variation?: { contains: string, mode: 'insensitive' }
      ecoCode?: { contains: string, mode: 'insensitive' } | { startsWith: string }
    }>
  }>
  popularity?: { gt: number }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') // A, B, C, D, E
    const family = searchParams.get('family')     // "Sicilian Defense"
    const search = searchParams.get('search')     // general search
    const popular = searchParams.get('popular')   // "true" for popular only
    const sort = searchParams.get('sort') || 'popularity' // NEW: sort parameter
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('🔍 Openings API called with params:', {
      category, family, search, popular, sort, limit, offset
    })

    // 🔧 PROPERLY TYPED whereClause
    const whereClause: PrismaWhereClause = {}

    // Filter by ECO category
    if (category && ['A', 'B', 'C', 'D', 'E'].includes(category)) {
      whereClause.ecoCode = {
        startsWith: category
      }
      console.log(`🎯 Filtering by category: ${category}`)
    }

    // Filter by opening family
    if (family) {
      whereClause.family = {
        contains: family,
        mode: 'insensitive'
      }
      console.log(`🎯 Filtering by family: ${family}`)
    }

    // General search
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { family: { contains: search, mode: 'insensitive' } },
        { variation: { contains: search, mode: 'insensitive' } },
        { ecoCode: { contains: search, mode: 'insensitive' } }
      ]
      console.log(`🎯 Search term: ${search}`)
      
      // 🔧 For search with category, combine search with category filter
      if (category && whereClause.OR) {
        whereClause.OR = whereClause.OR.map((condition) => ({
          AND: [
            condition,
            { ecoCode: { startsWith: category } }
          ]
        }))
      }
    }

    // Popular openings filter
    if (popular === 'true') {
      whereClause.popularity = {
        gt: 0
      }
      console.log(`🎯 Filtering popular openings`)
    }

    console.log('🔍 Final whereClause:', JSON.stringify(whereClause, null, 2))

    // 🎯 SIMPLE SORTING LOGIC (Prisma compatible)
    const getSortingOrder = (sortBy: string): any => {
      switch (sortBy) {
        case 'popularity':
          return [{ popularity: 'desc' }, { ecoCode: 'asc' }]
          
        case 'white_success':
          // Sort by white wins first, then by popularity
          return [{ whiteWins: 'desc' }, { popularity: 'desc' }]
          
        case 'black_success':
          return [{ blackWins: 'desc' }, { popularity: 'desc' }]
          
        case 'balanced':
          // Sort by draw rate (more draws = more balanced)
          return [{ draws: 'desc' }, { popularity: 'desc' }]
          
        case 'recent':
          // If no updatedAt field, use popularity as fallback
          return [{ popularity: 'desc' }, { ecoCode: 'desc' }]
          
        case 'alphabetical':
          return [{ ecoCode: 'asc' }]
          
        default:
          return [{ popularity: 'desc' }, { ecoCode: 'asc' }]
      }
    }

    const orderBy = getSortingOrder(sort)
    console.log(`🎯 Sorting by: ${sort}`, orderBy)

    // Get total count for pagination
    const totalCount = await prisma.opening.count({
      where: whereClause
    })

    console.log(`📊 Total count for query: ${totalCount}`)

    // DEBUG: Count total openings per category
    if (!category && !family && !search) {
      console.log('📊 DEBUG: Counting openings per category...')
      const categoryA = await prisma.opening.count({ where: { ecoCode: { startsWith: 'A' } } })
      const categoryB = await prisma.opening.count({ where: { ecoCode: { startsWith: 'B' } } })
      const categoryC = await prisma.opening.count({ where: { ecoCode: { startsWith: 'C' } } })
      const categoryD = await prisma.opening.count({ where: { ecoCode: { startsWith: 'D' } } })
      const categoryE = await prisma.opening.count({ where: { ecoCode: { startsWith: 'E' } } })
      const total = await prisma.opening.count()
      
      console.log('📊 Category counts:')
      console.log(`   A: ${categoryA}`)
      console.log(`   B: ${categoryB}`)
      console.log(`   C: ${categoryC}`)
      console.log(`   D: ${categoryD}`)
      console.log(`   E: ${categoryE}`)
      console.log(`   Total: ${total}`)
    }

    const openings = await prisma.opening.findMany({
      where: whereClause,
      orderBy: orderBy,
      take: limit,
      skip: offset
    })

    console.log(`✅ Found ${openings.length} openings (${offset}-${offset + openings.length} of ${totalCount})`)
    
    // DEBUG: Show first few ECO codes found
    if (openings.length > 0) {
      const ecoCodes = openings.slice(0, 5).map(o => o.ecoCode)
      console.log(`🔍 First few ECO codes: ${ecoCodes.join(', ')}`)
    }

    return NextResponse.json({ 
      openings,
      count: openings.length,
      total: totalCount,
      offset,
      limit,
      hasMore: offset + openings.length < totalCount
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