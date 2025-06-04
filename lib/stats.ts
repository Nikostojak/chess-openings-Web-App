import { prisma } from './db'

export async function getDashboardStats() {
  try {
    const totalGames = await prisma.game.count()
    
    const games = await prisma.game.findMany()
    
    const wins = games.filter(game => game.result === 'win').length
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0
    
    // Find most played opening
    const openingCounts = games.reduce((acc, game) => {
      acc[game.opening] = (acc[game.opening] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const favoriteOpening = Object.entries(openingCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None yet'
    
    const recentGames = await prisma.game.findMany({
      orderBy: { date: 'desc' },
      take: 5
    })
    
    return {
      totalGames,
      winRate,
      favoriteOpening,
      recentGames
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      totalGames: 0,
      winRate: 0,
      favoriteOpening: 'None yet',
      recentGames: []
    }
  }
}