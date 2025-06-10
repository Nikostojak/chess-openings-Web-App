import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    
    console.log('📊 Getting user opening stats...')
    
    // TODO: Replace with real user authentication
    const userId = 'temp-user-123'

    // Get user's opening performance
    const openingStats = await prisma.game.groupBy({
      by: ['ecoCode'],
      where: {
        userId,
        ecoCode: { not: null }
      },
      _count: {
        _all: true
      }
    })

    console.log(`📈 Found stats for ${openingStats.length} openings`)

    // Calculate detailed stats for each opening
    const detailedStats = await Promise.all(
      openingStats.map(async (stat) => {
        if (!stat.ecoCode) return null

        // Get games for this opening
        const games = await prisma.game.findMany({
          where: {
            userId,
            ecoCode: stat.ecoCode
          },
          orderBy: { date: 'desc' }
        })

        const wins = games.filter(g => g.result === 'win').length
        const losses = games.filter(g => g.result === 'loss').length
        const draws = games.filter(g => g.result === 'draw').length
        const winRate = games.length > 0 ? (wins / games.length) * 100 : 0

        // Get opening details
        const opening = await prisma.opening.findUnique({
          where: { ecoCode: stat.ecoCode }
        })

        return {
          ecoCode: stat.ecoCode,
          opening: opening?.name || 'Unknown Opening',
          family: opening?.family || 'Unknown',
          gamesPlayed: stat._count._all,
          wins,
          losses,
          draws,
          winRate,
          lastPlayed: games[0]?.date || null,
          popularity: opening?.popularity || 0
        }
      })
    )

    // Filter out null results and sort by games played
    const validStats = detailedStats
      .filter((stat): stat is NonNullable<typeof stat> => stat !== null)
      .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
      .slice(0, limit)

    // Calculate overall user stats
    const totalGames = validStats.reduce((sum, stat) => sum + stat.gamesPlayed, 0)
    const totalWins = validStats.reduce((sum, stat) => sum + stat.wins, 0)
    const totalLosses = validStats.reduce((sum, stat) => sum + stat.losses, 0)
    const totalDraws = validStats.reduce((sum, stat) => sum + stat.draws, 0)
    const overallWinRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0

    // Find strengths and weaknesses
    const strengths = validStats
      .filter(stat => stat.gamesPlayed >= 3 && stat.winRate >= 60)
      .slice(0, 5)

    const weaknesses = validStats
      .filter(stat => stat.gamesPlayed >= 3 && stat.winRate <= 40)
      .slice(0, 5)

    // Opening diversity
    const openingFamilies = new Set(validStats.map(stat => stat.family)).size

    console.log(`✅ Processed stats for ${validStats.length} openings`)

    return NextResponse.json({
      overallStats: {
        totalGames,
        totalWins,
        totalLosses,
        totalDraws,
        overallWinRate,
        openingsPlayed: validStats.length,
        openingFamilies
      },
      openingStats: validStats,
      strengths,
      weaknesses,
      recommendations: generateRecommendations(validStats)
    })

  } catch (error) {
    console.error('❌ Error fetching user opening stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user opening stats' },
      { status: 500 }
    )
  }
}

function generateRecommendations(stats: Array<{
  gamesPlayed: number
  winRate: number
  opening: string
  ecoCode: string
}>) {
  const recommendations = []

  // Recommend popular openings user hasn't tried
  if (stats.length < 10) {
    recommendations.push({
      type: 'expand',
      title: 'Expand Your Repertoire',
      description: 'Try playing some popular openings like the Sicilian Defense or Queen\'s Gambit',
      priority: 'high'
    })
  }

  // Recommend improving weak openings
  const weakOpenings = stats.filter(s => s.gamesPlayed >= 5 && s.winRate < 40)
  if (weakOpenings.length > 0) {
    recommendations.push({
      type: 'improve',
      title: 'Focus on Weak Openings',
      description: `Consider studying theory for ${weakOpenings[0].opening}`,
      priority: 'medium',
      ecoCode: weakOpenings[0].ecoCode
    })
  }

  // Recommend playing more of successful openings
  const strongOpenings = stats.filter(s => s.gamesPlayed >= 3 && s.winRate > 70)
  if (strongOpenings.length > 0) {
    recommendations.push({
      type: 'continue',
      title: 'Keep Playing Strong Openings',
      description: `You're doing great with ${strongOpenings[0].opening}! Play it more often.`,
      priority: 'low',
      ecoCode: strongOpenings[0].ecoCode
    })
  }

  return recommendations
}