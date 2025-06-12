'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Filter, BookOpen, TrendingUp, Users, ChevronRight } from 'lucide-react'

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
    description: 'Queen\'s Pawn openings',
    count: 0
  },
  {
    category: 'E',
    name: 'Indian Defenses',
    description: 'Indian defense systems',
    count: 0
  }
]

export default function OpeningsPage() {
  const [openings, setOpenings] = useState<Opening[]>([])
  const [filteredOpenings, setFilteredOpenings] = useState<Opening[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<OpeningCategory[]>(ECO_CATEGORIES)

  useEffect(() => {
    loadOpenings()
  }, [])

  useEffect(() => {
    filterOpenings()
  }, [openings, searchQuery, selectedCategory])

  const loadOpenings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching openings...') // Debug
      
      const response = await fetch('/api/openings?limit=100')
      console.log('📡 Response status:', response.status) // Debug
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📊 Received data:', data) // Debug
      
      // 🔧 SAFETY CHECK - handle different API response formats
      const openingsArray = data.openings || data || []
      
      if (!Array.isArray(openingsArray)) {
        console.error('❌ Expected array, got:', typeof openingsArray, openingsArray)
        throw new Error('API returned invalid data format')
      }
      
      console.log(`✅ Loaded ${openingsArray.length} openings`) // Debug
      setOpenings(openingsArray)
      
      // Update category counts
      const updatedCategories = categories.map(cat => ({
        ...cat,
        count: openingsArray.filter((op: Opening) => op.ecoCode.startsWith(cat.category)).length
      }))
      setCategories(updatedCategories)
      
    } catch (error) {
      console.error('❌ Error loading openings:', error)
      setError(error instanceof Error ? error.message : 'Failed to load openings')
      setOpenings([]) // Fallback to empty array
    } finally {
      setLoading(false)
    }
  }

  const filterOpenings = () => {
    if (!Array.isArray(openings)) {
      console.warn('⚠️ Openings is not an array:', openings)
      setFilteredOpenings([])
      return
    }

    let filtered = openings

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(opening => opening.ecoCode.startsWith(selectedCategory))
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(opening =>
        opening.name.toLowerCase().includes(query) ||
        opening.family.toLowerCase().includes(query) ||
        opening.ecoCode.toLowerCase().includes(query) ||
        opening.variation?.toLowerCase().includes(query)
      )
    }

    setFilteredOpenings(filtered)
  }

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
              onClick={loadOpenings}
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
        </div>

        {/* ECO Categories */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
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
              {openings?.length || 0} openings
            </div>
          </button>

          {categories.map((category) => (
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
                <span className="text-sm text-gray-500">{category.count}</span>
              </div>
              <div className="font-medium text-sm text-gray-700">{category.name}</div>
              <div className="text-xs text-gray-500 mt-1">{category.description}</div>
            </button>
          ))}
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
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              <span>
                Showing {filteredOpenings?.length || 0} of {openings?.length || 0} openings
              </span>
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
            <p className="text-gray-500">Try adjusting your search or category filter</p>
            {(openings?.length || 0) === 0 && (
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

        {/* Load More - disabled for now */}
        {(filteredOpenings?.length || 0) > 0 && (filteredOpenings?.length || 0) < (openings?.length || 0) && (
          <div className="text-center mt-8">
            <button
              onClick={() => {/* TODO: Load more openings */}}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Load More Openings
            </button>
          </div>
        )}
      </div>
    </div>
  )
}