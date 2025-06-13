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

// 🧠 HIBRIDNI PRISTUP - pametno učitavanje na osnovu veličine
const LOAD_STRATEGY = {
  // Male kategorije: učitaj sve odmah (< 400)
  SMALL_THRESHOLD: 400,
  
  // Srednje kategorije: učitaj 300 pa pagination (400-800)  
  MEDIUM_THRESHOLD: 800,
  MEDIUM_INITIAL: 300,
  
  // Velike kategorije: pagination odmah (> 800)
  LARGE_PAGE_SIZE: 150,
  
  // Search: uvijek sve (filtrirano je)
  SEARCH_ALL: true
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

  // 🔧 DETERMINE LOAD STRATEGY based on category size
  const determineLoadStrategy = (categorySize: number): 'small' | 'medium' | 'large' => {
    if (categorySize <= LOAD_STRATEGY.SMALL_THRESHOLD) return 'small'
    if (categorySize <= LOAD_STRATEGY.MEDIUM_THRESHOLD) return 'medium'
    return 'large'
  }

  // 🔧 GET OPTIMAL PAGE SIZE based on strategy
  const getPageSize = (strategy: 'small' | 'medium' | 'large', isFirstLoad: boolean = false): number => {
    switch (strategy) {
      case 'small': return 9999 // Load all
      case 'medium': return isFirstLoad ? LOAD_STRATEGY.MEDIUM_INITIAL : LOAD_STRATEGY.LARGE_PAGE_SIZE
      case 'large': return LOAD_STRATEGY.LARGE_PAGE_SIZE
      default: return LOAD_STRATEGY.LARGE_PAGE_SIZE
    }
  }

  // 🔧 LOAD CATEGORY STATS
  const loadCategoryStats = useCallback(async () => {
    try {
      console.log('📊 Loading category statistics...')
      
      const response = await fetch('/api/openings/stats')
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`)
      }
      
      const stats = await response.json()
      console.log('📊 Category stats:', stats)
      
      const updatedCategories = categories.map(cat => ({
        ...cat,
        count: stats.categories[cat.category] || 0
      }))
      
      setCategories(updatedCategories)
      setTotalCount(stats.total)
      
    } catch (error) {
      console.error('❌ Error loading category stats:', error)
    }
  }, [categories])

  // 🧠 SMART LOADING with hybrid strategy
  const loadOpeningsForCategory = useCallback(async (page: number = 1, reset: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      setError(null)
      
      // Determine category size and strategy
      const categorySize = selectedCategory === 'all' 
        ? totalCount 
        : categories.find(c => c.category === selectedCategory)?.count || 0
      
      const strategy = searchQuery ? 'small' : determineLoadStrategy(categorySize)
      const pageSize = getPageSize(strategy, page === 1)
      
      setLoadStrategy(strategy)
      
      console.log(`🧠 HYBRID STRATEGY: ${strategy.toUpperCase()} (${categorySize} items, pageSize: ${pageSize})`)
      
      const offset = (page - 1) * pageSize
      let url = `/api/openings?limit=${pageSize}&offset=${offset}`
      
      if (selectedCategory !== 'all') {
        url += `&category=${selectedCategory}`
      }
      
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`
      }
      
      const response = await fetch(url)
      console.log('📡 Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📊 Received data:', data)
      
      const openingsArray = data.openings || data || []
      const totalAvailableCount = data.total || 0
      
      if (!Array.isArray(openingsArray)) {
        console.error('❌ Expected array, got:', typeof openingsArray, openingsArray)
        throw new Error('API returned invalid data format')
      }
      
      console.log(`✅ Loaded ${openingsArray.length} openings using ${strategy} strategy`)
      
      if (reset || page === 1) {
        setOpenings(openingsArray)
      } else {
        setOpenings(prev => [...prev, ...openingsArray])
      }
      
      setCurrentPage(page)
      
      // Set hasMore based on strategy
      if (strategy === 'small' || searchQuery) {
        setHasMore(false) // Loaded everything
      } else {
        // Calculate current total without depending on openings.length in dependency
        const currentTotal = reset ? openingsArray.length : page * pageSize
        setHasMore(currentTotal < totalAvailableCount && openingsArray.length === pageSize)
      }
      
    } catch (error) {
      console.error('❌ Error loading openings:', error)
      setError(error instanceof Error ? error.message : 'Failed to load openings')
      if (page === 1) {
        setOpenings([])
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [selectedCategory, categories, totalCount, searchQuery]) // REMOVED openings.length!

  // 🔧 LOAD MORE
  const loadMoreOpenings = useCallback(async () => {
    if (!hasMore || loadingMore || loadStrategy === 'small') return
    await loadOpeningsForCategory(currentPage + 1, false)
  }, [hasMore, loadingMore, loadStrategy, currentPage, loadOpeningsForCategory])

  // 🔧 LOAD INITIAL DATA
  const loadInitialData = useCallback(async () => {
    await loadCategoryStats()
  }, [loadCategoryStats])

  // 🔧 FILTER OPENINGS (now handles search reset)
  const filterOpenings = useCallback(() => {
    if (!Array.isArray(openings)) {
      console.warn('⚠️ Openings is not an array:', openings)
      setFilteredOpenings([])
      return
    }

    const filtered = openings

    // For search, filtering is done on API level, so just show all results
    if (searchQuery) {
      setFilteredOpenings(filtered)
      return
    }

    // No client-side filtering needed since API handles category filtering
    setFilteredOpenings(filtered)
  }, [openings, searchQuery])

  // Infinite scroll effect
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
  }, [loadingMore, hasMore, infiniteScroll, loadStrategy, loadMoreOpenings])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  useEffect(() => {
    // Reset pagination when category changes
    setCurrentPage(1)
    setHasMore(false)
    setOpenings([])
    loadOpeningsForCategory(1, true)
  }, [selectedCategory, loadOpeningsForCategory])

  useEffect(() => {
    filterOpenings()
  }, [filterOpenings])

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        setCurrentPage(1)
        setHasMore(false)
        loadOpeningsForCategory(1, true)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, loadOpeningsForCategory])

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

  const getStrategyInfo = () => {
    switch (loadStrategy) {
      case 'small': return { icon: '⚡', text: 'All loaded instantly', color: 'text-green-600' }
      case 'medium': return { icon: '🚀', text: 'Smart loading', color: 'text-blue-600' }
      case 'large': return { icon: '📚', text: 'Paginated loading', color: 'text-purple-600' }
    }
  }

  // 🚨 ERROR STATE
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
            <div className="space-y-2 text-sm text-gray-600">
              <p>Possible solutions:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Run the seed script: <code className="bg-gray-100 px-1 rounded">npx tsx scripts/seed-eco.ts</code></li>
                <li>Check if database has openings: <code className="bg-gray-100 px-1 rounded">npx prisma studio</code></li>
                <li>Verify API endpoint: <code className="bg-gray-100 px-1 rounded">curl http://localhost:3000/api/openings</code></li>
              </ul>
            </div>
            <button
              onClick={loadInitialData}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
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
              {loadStrategy !== 'small' && (
                <span className="ml-2 text-gray-500">
                  • {openings.length} of {selectedCategory === 'all' ? totalCount : categories.find(c => c.category === selectedCategory)?.count || 0} loaded
                </span>
              )}
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
            <div className="text-sm text-gray-500">
              {totalCount} openings
            </div>
            <div className="text-xs text-gray-400 mt-1">Smart loading</div>
          </button>

          {categories.map((category) => {
            const strategy = determineLoadStrategy(category.count)
            const strategyEmoji = strategy === 'small' ? '⚡' : strategy === 'medium' ? '🚀' : '📚'
            
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

        {/* Search and Filters */}
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
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>
                  Showing {filteredOpenings?.length || 0}
                  {!searchQuery && (
                    <span> of {selectedCategory === 'all' ? totalCount : categories.find(c => c.category === selectedCategory)?.count || 0}</span>
                  )}
                  {searchQuery && (
                    <span> results</span>
                  )}
                </span>
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

        {/* Openings Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-500">Loading openings...</p>
          </div>
        ) : (filteredOpenings?.length || 0) === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No openings found</h3>
            <p className="text-gray-500">
              {searchQuery ? 'Try a different search term' : 'Try adjusting your category filter'}
            </p>
            {totalCount === 0 && (
              <div className="mt-4 text-sm text-gray-600">
                <p>Looks like the database is empty. Run the seed script:</p>
                <code className="bg-gray-100 px-2 py-1 rounded mt-2 inline-block">npx tsx scripts/seed-eco.ts</code>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOpenings.map((opening) => (
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
                      <div className={`text-lg font-bold ${getWinRateColor(opening.whiteWins, opening.blackWins, opening.draws)}`}>
                        {formatWinRate(opening.whiteWins, opening.blackWins, opening.draws)}
                      </div>
                      <div className="text-xs text-gray-500">White win rate</div>
                    </div>
                    
                    <ChevronRight className="h-5 w-5 text-gray-400 mx-auto" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Load More Button - only for medium/large strategies */}
        {!loading && !searchQuery && hasMore && filteredOpenings.length > 0 && loadStrategy !== 'small' && !infiniteScroll && (
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
            <p className="text-sm text-gray-500 mt-2">
              Loaded {openings.length} of {selectedCategory === 'all' ? totalCount : categories.find(c => c.category === selectedCategory)?.count || 0} openings
            </p>
          </div>
        )}

        {/* Loading more indicator for infinite scroll */}
        {loadingMore && infiniteScroll && loadStrategy !== 'small' && (
          <div className="text-center mt-8">
            <div className="inline-flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-2"></div>
              Loading more openings...
            </div>
          </div>
        )}

        {/* All loaded message */}
        {!loading && !searchQuery && !hasMore && filteredOpenings.length > 0 && loadStrategy !== 'small' && (
          <div className="text-center mt-8">
            <div className="inline-flex items-center text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
              <BookOpen className="h-4 w-4 mr-2" />
              All openings loaded ({openings.length} total)
            </div>
          </div>
        )}
      </div>
    </div>
  )
}