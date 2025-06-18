import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, TrendingUp, Users, Clock, Trophy, BookOpen, Target,
  Crown, Star, Filter, Play
} from 'lucide-react'
import ChessboardViewer from '../../../components/chess/ChessboardViewer'
import EliteIndicators from '../../../components/openings/EliteIndicators'
import GamesList from '../../../components/games/GamesList'

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
  params,
  searchParams 
}: { 
  params: Promise<{ ecoCode: string }>
  searchParams: Promise<{ filter?: string; sort?: string }>
}) {
  const { ecoCode } = await params
  const { filter = 'all', sort = 'date' } = await searchParams
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
          
          {/* Left Column - Elite Data & Main Info */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Elite Tournament Indicators - FEATURED */}
            <Suspense fallback={<EliteIndicatorsSkeleton />}>
              <EliteIndicators 
                ecoCode={opening.ecoCode}
                openingName={opening.name}
                className="shadow-lg border-2 border-blue-100 bg-gradient-to-r from-blue-50/50 to-purple-50/50"
              />
            </Suspense>

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

            {/* Enhanced Master Game Statistics */}
            <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Master Game Statistics
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

              {/* Performance Comparison */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Elite vs General Performance</h3>
                <p className="text-sm text-gray-600">
                  Elite tournament games may show different patterns than general play. 
                  Check the Elite Tournament Data above for professional-level insights.
                </p>
              </div>
            </div>

            {/* Enhanced Game Explorer */}
            <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Game Explorer
                </h2>
                
                {/* Elite Filter Buttons */}
                <div className="flex gap-2">
                  <FilterButton 
                    active={filter === 'all'}
                    href={`/openings/${opening.ecoCode}?filter=all&sort=${sort}`}
                  >
                    All Games
                  </FilterButton>
                  <FilterButton 
                    active={filter === 'elite'}
                    href={`/openings/${opening.ecoCode}?filter=elite&sort=${sort}`}
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Elite Only
                  </FilterButton>
                  <FilterButton 
                    active={filter === 'wc'}
                    href={`/openings/${opening.ecoCode}?filter=wc&sort=${sort}`}
                  >
                    <Crown className="h-4 w-4 mr-1" />
                    WC Games
                  </FilterButton>
                </div>
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-4 mb-4 text-sm">
                <span className="text-gray-600 flex items-center">
                  <Filter className="h-4 w-4 mr-1" />
                  Sort by:
                </span>
                <SortButton 
                  active={sort === 'date'}
                  href={`/openings/${opening.ecoCode}?filter=${filter}&sort=date`}
                >
                  Latest
                </SortButton>
                <SortButton 
                  active={sort === 'rating'}
                  href={`/openings/${opening.ecoCode}?filter=${filter}&sort=rating`}
                >
                  Rating
                </SortButton>
                <SortButton 
                  active={sort === 'elite'}
                  href={`/openings/${opening.ecoCode}?filter=${filter}&sort=elite`}
                >
                  Elite Firsto
                </SortButton>
              </div>
              
              <Suspense fallback={<GamesListSkeleton />}>
                <GamesList 
                  ecoCode={opening.ecoCode}
                  filter={filter}
                  sort={sort}
                  showEliteBadges={true}
                  limit={10}
                />
              </Suspense>
            </div>

            {/* Your Recent Games - Enhanced */}
            {userGames.length > 0 && (
              <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Your Recent Games
                </h2>
                
                <div className="space-y-3">
                  {userGames.slice(0, 5).map((game) => (
                    <div key={game.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
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
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium capitalize">{game.result}</span>
                        <Link 
                          href={`/games/${game.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                
                {userGames.length > 5 && (
                  <div className="mt-4 text-center">
                    <Link href="/games" className="text-sm text-blue-600 hover:text-blue-700">
                      View all your games with this opening →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Your Stats & Related */}
          <div className="space-y-6">
            
            {/* Enhanced Your Performance */}
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

                  {/* Performance vs Masters */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-900 mb-1">vs Master Level</div>
                    <div className="text-xs text-blue-700">
                      Your {userStats.winRate.toFixed(1)}% vs Masters {masterStats.whiteWinRate.toFixed(1)}%
                      {userStats.winRate > masterStats.whiteWinRate ? 
                        ' 🔥 Above master level!' : 
                        ` (${(masterStats.whiteWinRate - userStats.winRate).toFixed(1)}% to improve)`
                      }
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <Link
                      href="/games/add"
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center block"
                    >
                      <Play className="h-4 w-4 inline mr-2" />
                      Play this opening
                    </Link>
                    <Link
                      href={`/stats?opening=${opening.ecoCode}`}
                      className="w-full border border-blue-600 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors text-center block text-sm"
                    >
                      View detailed stats
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">You haven&apos;t played this opening yet</p>
                  <div className="space-y-2">
                    <Link
                      href="/games/add"
                      className="block bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Try this opening
                    </Link>
                    <div className="text-xs text-gray-500">
                      Master win rate: {masterStats.whiteWinRate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Related Openings */}
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
                      className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {related.name}
                          </div>
                          <div className="text-sm text-gray-500">{related.ecoCode}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            {related.popularity.toLocaleString()} games
                          </div>
                          <div className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            View details →
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="mt-4 text-center">
                  <Link 
                    href={`/openings?family=${encodeURIComponent(opening.family)}`}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    View all {opening.family} openings →
                  </Link>
                </div>
              </div>
            )}

            {/* Elite Learning Tip */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6">
              <div className="flex items-center mb-3">
                <Crown className="h-5 w-5 text-yellow-600 mr-2" />
                <h3 className="font-medium text-yellow-900">Elite Insight</h3>
              </div>
              <p className="text-sm text-yellow-800 leading-relaxed">
                Study elite tournament games to understand how professionals handle this opening. 
                Pay attention to move order, typical plans, and endgame transitions.
              </p>
              <Link 
                href={`/openings/${opening.ecoCode}?filter=elite`}
                className="inline-flex items-center mt-3 text-sm text-yellow-700 hover:text-yellow-900 font-medium"
              >
                Explore elite games <Trophy className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper Components
function FilterButton({ 
  children, 
  active, 
  href 
}: { 
  children: React.ReactNode
  active: boolean
  href: string 
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center ${
        active 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </Link>
  )
}

function SortButton({ 
  children, 
  active, 
  href 
}: { 
  children: React.ReactNode
  active: boolean
  href: string 
}) {
  return (
    <Link
      href={href}
      className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
        active 
          ? 'text-blue-600 bg-blue-50' 
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {children}
    </Link>
  )
}

// Skeleton Components
function EliteIndicatorsSkeleton() {
  return (
    <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
        <div className="mt-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    </div>
  )
}

function GamesListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="animate-pulse">
          <div className="h-16 bg-gray-200 rounded-lg"></div>
        </div>
      ))}
    </div>
  )
}