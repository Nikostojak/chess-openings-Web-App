// app/api/openings/[ecoCode]/elite-stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/db'

// Elite tournament detection logic
function isEliteGame(opponent: string, source?: string, notes?: string): {
  isElite: boolean
  tier: string
  reason?: string
  weight: number
} {
  const lowerOpponent = opponent.toLowerCase()
  const lowerNotes = (notes || '').toLowerCase()
  const lowerSource = (source || '').toLowerCase()
  
  // World Championship detection
  if (lowerNotes.includes('world championship') || 
      lowerOpponent.includes('carlsen') && lowerOpponent.includes('nepomniachtchi') ||
      lowerOpponent.includes('ding liren') && lowerOpponent.includes('gukesh')) {
    return {
      isElite: true,
      tier: 'WORLD_CHAMPIONSHIP',
      reason: 'World Championship game',
      weight: 15.0
    }
  }
  
  // Candidates Tournament
  if (lowerNotes.includes('candidates') || lowerSource.includes('candidates')) {
    return {
      isElite: true,
      tier: 'CANDIDATES',
      reason: 'Candidates Tournament',
      weight: 10.0
    }
  }
  
  // Super Elite players (2700+ rating equivalents)
  const superElitePlayers = [
    'carlsen', 'caruana', 'ding liren', 'nepomniachtchi', 'arjun', 
    'praggnanandhaa', 'gukesh', 'nakamura', 'firouzja', 'duda'
  ]
  
  if (superElitePlayers.some(player => lowerOpponent.includes(player))) {
    return {
      isElite: true,
      tier: 'SUPER_ELITE',
      reason: 'Super Elite player (2700+)',
      weight: 10.0
    }
  }
  
  // Elite tournaments (Tata Steel, Norway Chess, etc.)
  if (lowerNotes.includes('tata steel') || lowerNotes.includes('norway chess') ||
      lowerNotes.includes('grand prix') || lowerSource.includes('elite')) {
    return {
      isElite: true,
      tier: 'ELITE',
      reason: 'Elite tournament',
      weight: 5.0
    }
  }
  
  return {
    isElite: false,
    tier: 'REGULAR',
    weight: 1.0
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ecoCode: string }> }
): Promise<NextResponse> {
  try {
    // VAŽNO: Await params prije korištenja
    const { ecoCode } = await params
    
    // Get all games for this opening
    const allGames = await prisma.game.findMany({
      where: {
        ecoCode: ecoCode
      },
      select: {
        id: true,
        opponent: true,
        source: true,
        notes: true,
        date: true,
        result: true
      }
    })

    // Classify games as elite or regular
    const gamesWithEliteData = allGames.map(game => ({
      ...game,
      eliteData: isEliteGame(game.opponent, game.source || undefined, game.notes || undefined)
    }))

    const eliteGames = gamesWithEliteData.filter(game => game.eliteData.isElite)
    
    // Calculate tournament breakdown
    const tournaments = {
      worldChampionship: eliteGames.filter(g => g.eliteData.tier === 'WORLD_CHAMPIONSHIP').length,
      candidates: eliteGames.filter(g => g.eliteData.tier === 'CANDIDATES').length,
      superElite: eliteGames.filter(g => g.eliteData.tier === 'SUPER_ELITE').length,
      elite: eliteGames.filter(g => g.eliteData.tier === 'ELITE').length
    }

    // Calculate weighted score
    const totalWeight = eliteGames.reduce((sum, game) => sum + game.eliteData.weight, 0)
    const eliteWeight = eliteGames.length > 0 ? totalWeight / eliteGames.length : 1.0

    // Get trending data - games from last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentEliteGames = eliteGames.filter(game => 
      new Date(game.date) >= thirtyDaysAgo
    ).length

    const previousPeriodStart = new Date(thirtyDaysAgo)
    previousPeriodStart.setDate(previousPeriodStart.getDate() - 30)
    
    const previousEliteGames = eliteGames.filter(game => {
      const gameDate = new Date(game.date)
      return gameDate >= previousPeriodStart && gameDate < thirtyDaysAgo
    }).length

    const weeklyGrowth = previousEliteGames > 0 
      ? ((recentEliteGames - previousEliteGames) / previousEliteGames) * 100
      : 0

    // Get top players (most frequent opponents in elite games)
    const playerCounts: Record<string, { count: number; wins: number; total: number }> = {}
    
    eliteGames.forEach(game => {
      if (!playerCounts[game.opponent]) {
        playerCounts[game.opponent] = { count: 0, wins: 0, total: 0 }
      }
      playerCounts[game.opponent].count++
      playerCounts[game.opponent].total++
      if (game.result === 'win') {
        playerCounts[game.opponent].wins++
      }
    })

    const topPlayers = Object.entries(playerCounts)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 5)
      .map(([name, stats]) => ({
        name,
        rating: 2650, // Estimated elite rating
        gamesPlayed: stats.count,
        winRate: stats.total > 0 ? stats.wins / stats.total : 0
      }))

    // Get recent elite games
    const recentEliteGamesList = eliteGames
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(game => ({
        white: "You", // Since these are user's games
        black: game.opponent,
        result: game.result === 'win' ? '1-0' : game.result === 'loss' ? '0-1' : '1/2-1/2',
        tournament: game.eliteData.reason || 'Elite Game',
        date: game.date.toISOString(),
        rating: 2650 // Estimated
      }))

    const lastEliteGame = eliteGames.length > 0 ? 
      eliteGames.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] : 
      null

    const eliteStats = {
      ecoCode,
      totalGames: allGames.length,
      eliteGames: eliteGames.length,
      eliteWeight: Math.round(eliteWeight * 10) / 10,
      tournaments,
      trending: {
        isHot: weeklyGrowth > 20,
        weeklyGrowth: Math.round(weeklyGrowth),
        lastEliteGame: lastEliteGame?.date.toISOString() || null
      },
      topPlayers,
      recentEliteGames: recentEliteGamesList
    }
    
    return NextResponse.json({
      success: true,
      eliteStats
    })
  } catch (error) {
    console.error('Error fetching elite stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch elite statistics' 
      },
      { status: 500 }
    )
  }
}