'use client'

import { useState } from 'react'
import { Download, User, Calendar, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react'
import { lichessAPI } from '@/lib/lichess'

type ConvertedGame = {
  date: Date
  opponent: string
  result: string
  opening: string
  timeControl: string
  notes: string
  pgn?: string
  source: string
  externalId: string
}

export default function LichessImport() {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [games, setGames] = useState<ConvertedGame[]>([])
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set())
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle')
  const [maxGames, setMaxGames] = useState(10)

  const fetchGames = async () => {
    if (!username.trim()) return

    setIsLoading(true)
    setGames([])
    setSelectedGames(new Set())

    try {
      // Verify user exists
      await lichessAPI.getUserProfile(username)
      
      // Fetch recent games
      const lichessGames = await lichessAPI.getUserGames(username, { 
        max: maxGames,
        rated: true 
      })

      const convertedGames = lichessGames.map(game => 
        lichessAPI.convertLichessGameToOurFormat(game, username)
      )

      setGames(convertedGames)
      // Auto-select all games
      setSelectedGames(new Set(convertedGames.map((_, index) => index.toString())))
    } catch (error) {
      console.error('Error fetching games:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to fetch games'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleGameSelection = (index: string) => {
    const newSelected = new Set(selectedGames)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedGames(newSelected)
  }

  const importSelectedGames = async () => {
    const gamesToImport = games.filter((_, index) => selectedGames.has(index.toString()))
    
    if (gamesToImport.length === 0) return

    setImportStatus('importing')

    try {
      for (const game of gamesToImport) {
        const response = await fetch('/api/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: game.date.toISOString().split('T')[0],
            opponent: game.opponent,
            result: game.result,
            opening: game.opening,
            timeControl: game.timeControl,
            notes: game.notes
          })
        })

        if (!response.ok) {
          throw new Error(`Failed to import game against ${game.opponent}`)
        }
      }

      setImportStatus('success')
      setTimeout(() => {
        window.location.reload() // Refresh to show new games
      }, 2000)
    } catch (error) {
      console.error('Error importing games:', error)
      setImportStatus('error')
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <ExternalLink className="h-5 w-5 mr-2 text-green-600" />
          Import from Lichess
        </h3>
        <a 
          href="https://lichess.org" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-green-600 hover:text-green-700"
        >
          lichess.org ↗
        </a>
      </div>

      {/* Username Input */}
      <div className="space-y-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 mr-2" />
              Lichess Username
            </label>
            <input
              type="text"
              placeholder="Enter your lichess username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
            />
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              Max Games
            </label>
            <select
              value={maxGames}
              onChange={(e) => setMaxGames(Number(e.target.value))}
              className="p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
            >
              <option value={5}>5 games</option>
              <option value={10}>10 games</option>
              <option value={25}>25 games</option>
              <option value={50}>50 games</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchGames}
          disabled={isLoading || !username.trim()}
          className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Fetching games...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Fetch Games</span>
            </>
          )}
        </button>
      </div>

      {/* Games List */}
      {games.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-700">
              Found {games.length} games ({selectedGames.size} selected)
            </h4>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedGames(new Set(games.map((_, i) => i.toString())))}
                className="text-sm text-green-600 hover:text-green-700"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedGames(new Set())}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {games.map((game, index) => (
              <div
                key={index}
                className={`p-3 border rounded-xl cursor-pointer transition-colors ${
                  selectedGames.has(index.toString())
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleGameSelection(index.toString())}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      game.result === 'win' ? 'bg-emerald-500' : 
                      game.result === 'loss' ? 'bg-red-500' : 'bg-amber-500'
                    }`}></div>
                    <span className="font-medium">vs {game.opponent}</span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-600">{game.opening}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{game.date.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={importSelectedGames}
            disabled={selectedGames.size === 0 || importStatus === 'importing'}
            className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {importStatus === 'importing' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Importing {selectedGames.size} games...</span>
              </>
            ) : importStatus === 'success' ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Import Successful!</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Import {selectedGames.size} Selected Games</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-3 bg-blue-50 rounded-xl">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">How it works:</p>
            <ul className="text-xs space-y-1 text-blue-600">
              <li>• Enter your public Lichess username</li>
              <li>• We&apos;ll fetch your recent rated games</li>
              <li>• Select which games you want to import</li>
              <li>• Games will be added to your tracker automatically</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}