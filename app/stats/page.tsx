import { prisma } from '@/lib/db'
import StatsCharts from '@/components/stats/StatsCharts'

async function getStatsData() {
  try {
    const games = await prisma.game.findMany({
      orderBy: { date: 'asc' }
    })

    // Win rate by opening
    const openingStats = games.reduce((acc, game) => {
      if (!acc[game.opening]) {
        acc[game.opening] = { wins: 0, total: 0 }
      }
      acc[game.opening].total += 1
      if (game.result === 'win') {
        acc[game.opening].wins += 1
      }
      return acc
    }, {} as Record<string, { wins: number; total: number }>)

    const openingWinRates = Object.entries(openingStats)
      .map(([opening, stats]) => ({
        opening,
        winRate: Math.round((stats.wins / stats.total) * 100),
        gamesPlayed: stats.total
      }))
      .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
      .slice(0, 8) // Top 8 most played openings

    // Results distribution
    const resultsCount = games.reduce((acc, game) => {
      acc[game.result] = (acc[game.result] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Games over time (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentGames = games.filter(game => new Date(game.date) >= thirtyDaysAgo)
    const gamesPerDay = recentGames.reduce((acc, game) => {
      const dateKey = new Date(game.date).toLocaleDateString()
      acc[dateKey] = (acc[dateKey] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalGames: games.length,
      openingWinRates,
      resultsCount,
      gamesPerDay
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    return {
      totalGames: 0,
      openingWinRates: [],
      resultsCount: {},
      gamesPerDay: {}
    }
  }
}

export default async function StatsPage() {
  const statsData = await getStatsData()

  if (statsData.totalGames === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Statistics</h1>
          
          <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No statistics yet</h3>
            <p className="text-gray-600 mb-4">Play some games to see your performance analytics</p>
            <a 
              href="/games/add"
              className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Add your first game
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Statistics</h1>
          <p className="text-gray-600">Analyze your chess performance and opening trends</p>
        </div>

        <StatsCharts data={statsData} />
      </div>
    </div>
  )
}