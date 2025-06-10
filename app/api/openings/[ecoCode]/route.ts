import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ ecoCode: string }> }
) {
  try {
    const { ecoCode } = await context.params
    console.log(`🔍 Getting details for opening: ${ecoCode}`)
    
    // Get opening details
    const opening = await prisma.opening.findUnique({
      where: { ecoCode: ecoCode.toUpperCase() },
      include: {
        userStats: {
          where: { userId: 'temp-user-123' }, // TODO: Replace with real user auth
          take: 1
        }
      }
    })

    if (!opening) {
      console.log(`❌ Opening not found: ${ecoCode}`)
      return NextResponse.json(
        { error: 'Opening not found' },
        { status: 404 }
      )
    }

    console.log(`✅ Found opening: ${opening.name}`)

    // Get user's games with this opening
    const userGames = await prisma.game.findMany({
      where: {
        ecoCode: ecoCode.toUpperCase(),
        userId: 'temp-user-123' // TODO: Replace with real user auth
      },
      orderBy: { date: 'desc' },
      take: 10
    })

    console.log(`📊 Found ${userGames.length} user games with this opening`)

    // Get related openings (same family)
    const relatedOpenings = await prisma.opening.findMany({
      where: {
        family: opening.family,
        ecoCode: { not: opening.ecoCode }
      },
      orderBy: { popularity: 'desc' },
      take: 5
    })

    console.log(`🔗 Found ${relatedOpenings.length} related openings`)

    // Calculate user performance
    const userStats = opening.userStats[0] || {
      gamesPlayed: userGames.length,
      wins: userGames.filter(g => g.result === 'win').length,
      losses: userGames.filter(g => g.result === 'loss').length,
      draws: userGames.filter(g => g.result === 'draw').length,
      winRate: 0
    }

    if (userStats.gamesPlayed > 0) {
      userStats.winRate = (userStats.wins / userStats.gamesPlayed) * 100
    }

    // Calculate master game statistics
    const totalMasterGames = opening.whiteWins + opening.blackWins + opening.draws
    const masterStats = {
      totalGames: totalMasterGames,
      whiteWinRate: totalMasterGames > 0 ? (opening.whiteWins / totalMasterGames) * 100 : 0,
      blackWinRate: totalMasterGames > 0 ? (opening.blackWins / totalMasterGames) * 100 : 0,
      drawRate: totalMasterGames > 0 ? (opening.draws / totalMasterGames) * 100 : 0
    }

    return NextResponse.json({
      opening: {
        ...opening,
        userStats: undefined // Remove from main object
      },
      userStats,
      userGames,
      relatedOpenings,
      masterStats
    })

  } catch (error) {
    console.error('❌ Error fetching opening details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch opening details' },
      { status: 500 }
    )
  }
}