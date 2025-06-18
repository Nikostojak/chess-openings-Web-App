'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, Filter, BookOpen, TrendingUp, ChevronRight } from 'lucide-react'

type Opening = {
  ecoCode: string
  name: string
  family: string
  variation?: string
  moves: string
  popularity: number
  whiteWins: number
  blackWins: number
  draws: number
}

type OpeningCategory = {
  category: string
  name: string
  description: string
  count: number
}

const ECO_CATEGORIES: OpeningCategory[] = [
  {
    category: 'A',
    name: 'Flank Openings',
    description: 'Uncommon openings and flank attacks',
    count: 0
  },
  {
    category: 'B',
    name: 'Semi-Open Games',
    description: 'Openings starting with 1.e4, Black replies other than 1...e5',
    count: 0
  },
  {
    category: 'C',
    name: 'Open Games',
    description: 'Openings starting with 1.e4 e5',
    count: 0
  },
  {
    category: 'D',
    name: 'Closed Games',
    description: 'Queen&apos;s Pawn openings',
    count: 0
  },
  {
    category: 'E',
    name: 'Indian Defenses',
    description: 'Indian defense systems',
    count: 0
  }
]

// 🧠 SIMPLE STRATEGY - determine load size based on category
const getLoadStrategy = (categorySize: number) => {
  if (categorySize <= 400) return { type: 'small', pageSize: 9999 }
  if (categorySize <= 800) return { type: 'medium', pageSize: 300 }
  return { type: 'large', pageSize: 150 }
}

export default function OpeningsPage() {
  const [openings, setOpenings] = useState<Opening[]>([])
  const [filteredOpenings, setFilteredOpenings] = useState<Opening[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<OpeningCategory[]>(ECO_CATEGORIES)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadStrategy, setLoadStrategy] = useState<'small' | 'medium' | 'large'>('medium')
  const [infiniteScroll, setInfiniteScroll] = useState(false)
  const [sortBy, setSortBy] = useState('popularity')

  // 🎯 SORTING OPTIONS for professional chess analysis
  const SORT_OPTIONS = [
    {
      value: 'popularity',
      label: 'Most Popular',
      description: 'By number of games played',
      icon: '🔥'
    },
    {
      value: 'white_success',
      label: 'Best for White', 
      description: 'Highest white win rate',
      icon: '⚪'
    },
    {
      value: 'black_success',
      label: 'Best for Black',
      description: 'Highest black win rate', 
      icon: '⚫'
    },
    {
      value: 'balanced',
      label: 'Most Balanced',
      description: 'Equal chances for both sides',
      icon: '⚖️'
    },
    {
      value: 'recent',
      label: 'Recently Updated',
      description: 'Latest data first',
      icon: '🕒'
    },
    {
      value: 'alphabetical',
      label: 'A-Z',
      description: 'By ECO code',
      icon: '🔤'
    }
  ]

  // 🚀 LOAD CATEGORY STATS - ONCE on mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        console.log('📊 Loading category statistics...')
        const response = await fetch('/api/openings/stats')
        if (!response.ok) throw new Error('Failed to fetch stats')
        
        const stats = await response.json()
        console.log('📊 Stats loaded:', stats)
        
        const updatedCategories = ECO_CATEGORIES.map(cat => ({
          ...cat,
          count: stats.categories[cat.category] || 0
        }))
        
        setCategories(updatedCategories)
        setTotalCount(stats.total)
      } catch (error) {
        console.error('❌ Stats error:', error)
      }
    }
    
    loadStats()
  }, []) // Fixed: removed categories from dependencies

  // 🚀 LOAD OPENINGS when category or sort changes  
  useEffect(() => {
    const loadOpenings = async () => {
      try {
        setLoading(true)
        setError(null)
        setCurrentPage(1)
        setHasMore(false)
        
        // Get category info
        const categorySize = selectedCategory === 'all' 
          ? totalCount 
          : categories.find(c => c.category === selectedCategory)?.count || 0
        
        const strategy = getLoadStrategy(categorySize)
        setLoadStrategy(strategy.type as 'small' | 'medium' | 'large')
        
        console.log(`🧠 Loading ${selectedCategory} (${categorySize} items) with ${strategy.type} strategy, sorted by ${sortBy}`)
        
        let url = `/api/openings?limit=${strategy.pageSize}&offset=0&sort=${sortBy}`
        if (selectedCategory !== 'all') {
          url += `&category=${selectedCategory}`
        }
        
        const response = await fetch(url)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        
        const data = await response.json()
        const openingsArray = data.openings || []
        
        console.log(`✅ Loaded ${openingsArray.length} openings`)
        
        setOpenings(openingsArray)
        setCurrentPage(1)
        
        // Set hasMore only for medium/large strategies
        if (strategy.type !== 'small') {
          setHasMore(openingsArray.length === strategy.pageSize && openingsArray.length < categorySize)
        } else {
          setHasMore(false)
        }
        
      } catch (error) {
        console.error('❌ Loading error:', error)
        setError(error instanceof Error ? error.message : 'Failed to load')
        setOpenings([])
      } finally {
        setLoading(false)
      }
    }

    // Only load if we have category stats
    if (categories.some(c => c.count > 0) || selectedCategory === 'all') {
      loadOpenings()
    }
  }, [selectedCategory, totalCount, sortBy, categories])

  // 🚀 SEARCH with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchQuery) {
        setFilteredOpenings(openings)
        return
      }

      const filtered = openings.filter(opening => {
        const query = searchQuery.toLowerCase()
        return (
          opening.name.toLowerCase().includes(query) ||
          opening.family.toLowerCase().includes(query) ||
          opening.ecoCode.toLowerCase().includes(query) ||
          opening.variation?.toLowerCase().includes(query)
        )
      })
      setFilteredOpenings(filtered)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, openings])

  // 🚀 LOAD MORE function - wrapped in useCallback
  const loadMoreOpenings = useCallback(async () => {
    if (loadingMore || !hasMore || loadStrategy === 'small') return

    try {
      setLoadingMore(true)
      
      const nextPage = currentPage + 1
      const pageSize = loadStrategy === 'medium' ? 150 : 150 // Use consistent page size for load more
      const offset = (nextPage - 1) * pageSize

      let url = `/api/openings?limit=${pageSize}&offset=${offset}&sort=${sortBy}`
      if (selectedCategory !== 'all') {
        url += `&category=${selectedCategory}`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const data = await response.json()
      const newOpenings = data.openings || []

      console.log(`✅ Loaded ${newOpenings.length} more openings (page ${nextPage})`)

      setOpenings(prev => [...prev, ...newOpenings])
      setCurrentPage(nextPage)
      setHasMore(newOpenings.length === pageSize)

    } catch (error) {
      console.error('❌ Load more error:', error)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, loadStrategy, currentPage, sortBy, selectedCategory])

  // 🚀 INFINITE SCROLL
  useEffect(() => {
    if (!infiniteScroll || loadStrategy === 'small') return

    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000 &&
        !loadingMore &&
        hasMore
      ) {
        loadMoreOpenings()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [infiniteScroll, loadingMore, hasMore, loadStrategy, loadMoreOpenings])

  const getWinRateColor = (whiteWins: number, blackWins: number, draws: number) => {
    const total = whiteWins + blackWins + draws
    if (total === 0) return 'text-gray-500'
    
    const whiteRate = (whiteWins / total) * 100
    if (whiteRate > 55) return 'text-green-600'
    if (whiteRate > 45) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatWinRate = (whiteWins: number, blackWins: number, draws: number) => {
    const total = whiteWins + blackWins + draws
    if (total === 0) return 'No data'
    
    const whiteRate = (whiteWins / total) * 100
    return `${whiteRate.toFixed(1)}%`
  }

  // 🎯 CALCULATE DETAILED STATS for display
  const getOpeningStats = (opening: Opening) => {
    const total = opening.whiteWins + opening.blackWins + opening.draws
    if (total === 0) return { whiteRate: 0, blackRate: 0, drawRate: 0, total: 0 }
    
    return {
      whiteRate: (opening.whiteWins / total) * 100,
      blackRate: (opening.blackWins / total) * 100, 
      drawRate: (opening.draws / total) * 100,
      total
    }
  }

  // 🏆 GET SORT INDICATOR for each opening
  const getSortIndicator = (opening: Opening) => {
    const stats = getOpeningStats(opening)
    
    switch (sortBy) {
      case 'white_success':
        return { 
          value: `${stats.whiteRate.toFixed(1)}%`, 
          label: 'White wins',
          color: stats.whiteRate > 50 ? 'text-green-600' : 'text-red-600'
        }
      case 'black_success':
        return { 
          value: `${stats.blackRate.toFixed(1)}%`, 
          label: 'Black wins',
          color: stats.blackRate > 40 ? 'text-green-600' : 'text-red-600'  
        }
      case 'balanced':
        const balance = Math.abs(stats.whiteRate - stats.blackRate)
        return { 
          value: `±${balance.toFixed(1)}%`, 
          label: 'Balance',
          color: balance < 5 ? 'text-green-600' : 'text-yellow-600'
        }
      case 'popularity':
        return { 
          value: opening.popularity.toLocaleString(), 
          label: 'Games',
          color: 'text-blue-600'
        }
      default:
        return { 
          value: formatWinRate(opening.whiteWins, opening.blackWins, opening.draws), 
          label: 'White wins',
          color: getWinRateColor(opening.whiteWins, opening.blackWins, opening.draws)
        }
    }
  }

  const getStrategyInfo = () => {
    switch (loadStrategy) {
      case 'small': return { icon: '⚡', text: 'All loaded', color: 'text-green-600' }
      case 'medium': return { icon: '🚀', text: 'Smart loading', color: 'text-blue-600' }
      case 'large': return { icon: '📚', text: 'Paginated', color: 'text-purple-600' }
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load openings</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Chess Openings</h1>
          <p className="text-gray-600">Explore and learn chess opening theory</p>
          
          {/* Strategy indicator */}
          {!loading && (
            <div className="mt-3 inline-flex items-center text-sm bg-white/70 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-1">
              <span className="mr-2">{getStrategyInfo().icon}</span>
              <span className={getStrategyInfo().color}>{getStrategyInfo().text}</span>
              <span className="ml-2 text-gray-500">
                • {openings.length} loaded
              </span>
            </div>
          )}
        </div>

        {/* ECO Categories */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              selectedCategory === 'all'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold text-gray-900">All Categories</div>
            <div className="text-sm text-gray-500">{totalCount} openings</div>
          </button>

          {categories.map((category) => {
            const strategy = getLoadStrategy(category.count)
            const strategyEmoji = strategy.type === 'small' ? '⚡' : strategy.type === 'medium' ? '🚀' : '📚'
            
            return (
              <button
                key={category.category}
                onClick={() => setSelectedCategory(category.category)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedCategory === category.category
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900">ECO {category.category}</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs">{strategyEmoji}</span>
                    <span className="text-sm text-gray-500">{category.count}</span>
                  </div>
                </div>
                <div className="font-medium text-sm text-gray-700">{category.name}</div>
                <div className="text-xs text-gray-500 mt-1">{category.description}</div>
              </button>
            )
          })}
        </div>

        {/* Search, Sort and Filters */}
        <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search openings by name, ECO code, or variation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Sort Dropdown */}
            <div className="md:w-64">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {SORT_OPTIONS.find(opt => opt.value === sortBy)?.description}
              </p>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>Showing {filteredOpenings.length} openings</span>
              </div>
              
              {loadStrategy !== 'small' && !searchQuery && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="infiniteScroll"
                    checked={infiniteScroll}
                    onChange={(e) => setInfiniteScroll(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="infiniteScroll" className="text-sm text-gray-600 cursor-pointer">
                    Auto-load on scroll
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-500">Loading openings...</p>
          </div>
        ) : filteredOpenings.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No openings found</h3>
            <p className="text-gray-500">
              {searchQuery ? 'Try a different search term' : 'No openings in this category'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOpenings.map((opening) => {
              const sortIndicator = getSortIndicator(opening)
              
              return (
                <Link
                  key={opening.ecoCode}
                  href={`/openings/${opening.ecoCode}`}
                  className="block bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 hover:shadow-md hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{opening.name}</h3>
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-mono">
                          {opening.ecoCode}
                        </span>
                        {opening.popularity > 0 && (
                          <div className="flex items-center text-sm text-gray-500">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            {opening.popularity.toLocaleString()} games
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Family:</span> {opening.family}
                        </div>
                        {opening.variation && (
                          <div>
                            <span className="font-medium">Variation:</span> {opening.variation}
                          </div>
                        )}
                      </div>
                      
                      <div className="font-mono text-sm text-gray-700 bg-gray-50 rounded p-2">
                        {opening.moves}
                      </div>
                    </div>
                    
                    <div className="ml-6 text-right">
                      <div className="mb-2">
                        <div className={`text-lg font-bold ${sortIndicator.color}`}>
                          {sortIndicator.value}
                        </div>
                        <div className="text-xs text-gray-500">{sortIndicator.label}</div>
                      </div>
                      
                      <ChevronRight className="h-5 w-5 text-gray-400 mx-auto" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Load More Button */}
        {!loading && !searchQuery && hasMore && loadStrategy !== 'small' && !infiniteScroll && (
          <div className="text-center mt-8">
            <button
              onClick={loadMoreOpenings}
              disabled={loadingMore}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
            >
              {loadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Loading more...
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Load More Openings
                </>
              )}
            </button>
          </div>
        )}

        {/* Infinite scroll loading indicator */}
        {loadingMore && infiniteScroll && (
          <div className="text-center mt-8">
            <div className="inline-flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-2"></div>
              Loading more openings...
            </div>
          </div>
        )}

        {/* All loaded indicator */}
        {!hasMore && openings.length > 0 && loadStrategy !== 'small' && (
          <div className="text-center mt-8">
            <div className="inline-flex items-center text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
              <BookOpen className="h-4 w-4 mr-2" />
              All openings loaded
            </div>
          </div>
        )}
      </div>
    </div>
  )
}