import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import GamesList from '../../components/games/GamesList'
import { prisma } from '../../lib/db'

async function getGames() {
  try {
    const games = await prisma.game.findMany({
      orderBy: { date: 'desc' }
    })
    return games
  } catch (error) {
    console.error('Error fetching games:', error)
    return []
  }
}

export default async function GamesPage() {
  const games = await getGames()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Games</h1>
            <p className="text-gray-600">
              {games.length} {games.length === 1 ? 'game' : 'games'} recorded
            </p>
          </div>
          <Link 
            href="/games/add"
            className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Add Game</span>
          </Link>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by opponent or opening..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <select className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
              <option value="">All Results</option>
              <option value="win">Wins</option>
              <option value="loss">Losses</option>
              <option value="draw">Draws</option>
            </select>
            <select className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
              <option value="">All Openings</option>
              <option value="Sicilian Defense">Sicilian Defense</option>
              <option value="Queen's Gambit">Queen&apos;s Gambit</option>
              <option value="King's Indian Defense">King&apos;s Indian Defense</option>
            </select>
          </div>
        </div>

        {/* Games List - cast to any to bypass type checking */}
        <GamesList games={games as any} />
        
      </div>
    </div>
  )
}