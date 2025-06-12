import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Users, Clock, Trophy, BookOpen, Target } from 'lucide-react'
import ChessboardViewer from '../../../components/chess/ChessboardViewer'

type OpeningData = {
  opening: {
    ecoCode: string
    name: string
    family: string
    variation?: string
    subvariation?: string
    moves: string
    fen: string
    popularity: number
    whiteWins: number
    blackWins: number
    draws: number
  }
  userStats: {
    gamesPlayed: number
    wins: number
    losses: number
    draws: number
    winRate: number
  }
  userGames: Array<{
    id: string
    date: Date
    opponent: string
    result: string
  }>
  relatedOpenings: Array<{
    ecoCode: string
    name: string
    popularity: number
  }>
  masterStats: {
    totalGames: number
    whiteWinRate: number
    blackWinRate: number
    drawRate: number
  }
}

async function getOpeningData(ecoCode: string): Promise<OpeningData | null> {
  try {
    const response = await fetch(`http://localhost:3000/api/openings/${ecoCode}`, {
      cache: 'no-store' // Always fetch fresh data
    })
    
    if (!response.ok) {
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching opening data:', error)
    return null
  }
}

export default async function OpeningDetailPage({ 
  params 
}: { 
  params: Promise<{ ecoCode: string }> 
}) {
  const { ecoCode } = await params
  const data = await getOpeningData(ecoCode.toUpperCase())

  if (!data) {
    notFound()
  }

  const { opening, userStats, userGames, relatedOpenings, masterStats } = data

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="mb-8">
          <Link href="/openings" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to openings
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{opening.name}</h1>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-mono text-sm">
                  {opening.ecoCode}
                </span>
              </div>
              <p className="text-gray-600">
                Family: {opening.family}
                {opening.variation && ` • Variation: ${opening.variation}`}
                {opening.subvariation && ` • ${opening.subvariation}`}
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500">Popularity</div>
              <div className="text-2xl font-bold text-blue-600">
                {opening.popularity.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">master games</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Opening Moves & Board */}
            <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Main Line
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                    {opening.moves}
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    <p><strong>FEN:</strong> {opening.fen}</p>
                  </div>
                </div>
                
                <div>
                  <ChessboardViewer 
                    pgn={opening.moves} 
                    title="Opening Position"
                  />
                </div>
              </div>
            </div>

            {/* Master Game Statistics */}
            <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Master Game Statistics
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {masterStats.totalGames.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Total Games</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {masterStats.whiteWinRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">White Wins</div>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {masterStats.blackWinRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">Black Wins</div>
                </div>
                
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">
                    {masterStats.drawRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">Draws</div>
                </div>
              </div>
            </div>

            {/* Your Recent Games */}
            {userGames.length > 0 && (
              <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Your Recent Games
                </h2>
                
                <div className="space-y-3">
                  {userGames.slice(0, 5).map((game) => (
                    <div key={game.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          game.result === 'win' ? 'bg-emerald-500' : 
                          game.result === 'loss' ? 'bg-red-500' : 'bg-amber-500'
                        }`}></div>
                        <span className="font-medium">vs {game.opponent}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(game.date).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-sm font-medium capitalize">{game.result}</span>
                    </div>
                  ))}
                </div>
                
                {userGames.length > 5 && (
                  <div className="mt-4 text-center">
                    <Link href="/games" className="text-sm text-blue-600 hover:text-blue-700">
                      View all games →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Your Stats & Related */}
          <div className="space-y-6">
            
            {/* Your Performance */}
            <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Your Performance
              </h2>
              
              {userStats.gamesPlayed > 0 ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {userStats.winRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500">Win Rate</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="font-bold text-gray-900">{userStats.gamesPlayed}</div>
                      <div className="text-gray-500">Games</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="font-bold text-green-600">{userStats.wins}</div>
                      <div className="text-gray-500">Wins</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="font-bold text-red-600">{userStats.losses}</div>
                      <div className="text-gray-500">Losses</div>
                    </div>
                    <div className="text-center p-3 bg-amber-50 rounded-lg">
                      <div className="font-bold text-amber-600">{userStats.draws}</div>
                      <div className="text-gray-500">Draws</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Link
                      href="/games/add"
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center block"
                    >
                      Play this opening
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">You haven&apos;t played this opening yet</p>
                  <Link
                    href="/games/add"
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try this opening
                  </Link>
                </div>
              )}
            </div>

            {/* Related Openings */}
            {relatedOpenings.length > 0 && (
              <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Related Openings
                </h2>
                
                <div className="space-y-3">
                  {relatedOpenings.map((related) => (
                    <Link
                      key={related.ecoCode}
                      href={`/openings/${related.ecoCode}`}
                      className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{related.name}</div>
                          <div className="text-sm text-gray-500">{related.ecoCode}</div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {related.popularity.toLocaleString()} games
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}