import Link from 'next/link'
import { getDashboardStats } from '../../lib/stats'
import { Calendar, User, Trophy } from 'lucide-react'

export default async function Dashboard() {
  const stats = await getDashboardStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Track your chess journey and opening performance</p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Games</h3>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalGames}</p>
            <p className="text-sm text-gray-500 mt-1">
              {stats.totalGames === 0 ? 'No games recorded yet' : 'Games tracked'}
            </p>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Win Rate</h3>
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.winRate}%</p>
            <p className="text-sm text-gray-500 mt-1">
              {stats.totalGames === 0 ? 'Start playing to see stats' : 'Overall performance'}
            </p>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Favorite Opening</h3>
              <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
            </div>
            <p className="text-lg font-semibold text-gray-900">{stats.favoriteOpening}</p>
            <p className="text-sm text-gray-500 mt-1">
              {stats.totalGames === 0 ? 'Track games to discover' : 'Most played'}
            </p>
          </div>
        </div>
        
        {/* Recent Games Card */}
        <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Recent Games</h3>
            <Link href="/games/add" className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
              Add Game
            </Link>
          </div>
          
          {stats.recentGames.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No games yet</h4>
              <p className="text-gray-600 mb-4">Start by recording your first chess game</p>
              <Link href="/games/add" className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                Add your first game
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentGames.map((game) => (
                <div key={game.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      game.result === 'win' ? 'bg-emerald-500' : 
                      game.result === 'loss' ? 'bg-red-500' : 'bg-amber-500'
                    }`}></div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{game.opponent}</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-600">{game.opening}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {new Date(game.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Trophy className={`h-4 w-4 ${
                      game.result === 'win' ? 'text-emerald-500' : 
                      game.result === 'loss' ? 'text-red-500' : 'text-amber-500'
                    }`} />
                    <span className="text-sm font-medium capitalize">{game.result}</span>
                  </div>
                </div>
              ))}
              <div className="text-center pt-4">
                <Link href="/games" className="text-sm text-gray-600 hover:text-gray-900">
                  View all games →
                </Link>
              </div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  )
}