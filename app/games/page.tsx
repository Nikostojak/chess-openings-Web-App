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
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">My Games</h1>
            <p className="text-gray-400">
              {games.length} {games.length === 1 ? 'game' : 'games'} recorded
            </p>
          </div>
          <Link 
            href="/games/add"
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Add Game</span>
          </Link>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by opponent or opening..."
                className="w-full pl-10 pr-4 py-2 border border-gray-700 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-white placeholder-gray-500"
              />
            </div>
            <select className="px-4 py-2 border border-gray-700 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-white">
              <option value="">All Results</option>
              <option value="win">Wins</option>
              <option value="loss">Losses</option>
              <option value="draw">Draws</option>
            </select>
            <select className="px-4 py-2 border border-gray-700 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-white">
              <option value="">All Openings</option>
              <option value="Sicilian Defense">Sicilian Defense</option>
              <option value="Queen's Gambit">Queen&apos;s Gambit</option>
              <option value="King's Indian Defense">King&apos;s Indian Defense</option>
            </select>
          </div>
        </div>

        {/* Games List - minimal transformation */}
        <GamesList games={games.map(game => ({
          ...game,
          ecoCode: game.ecoCode || undefined,
          timeControl: game.timeControl,
          notes: game.notes
        }))} />
        
      </div>
    </div>
  )
}