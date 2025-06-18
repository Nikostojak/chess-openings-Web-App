'use client'

import { useState, useRef } from 'react'
import { FileText, Upload, AlertCircle, CheckCircle, Copy, FileUp } from 'lucide-react'
import { Chess } from 'chess.js'

type ParsedGame = {
  date: string
  opponent: string
  result: string
  opening: string
  timeControl: string
  notes: string
  pgn: string
  white: string
  black: string
  event?: string
  site?: string
}

export default function PGNImport({ 
  onPgnChange 
}: { 
  onPgnChange?: (pgn: string) => void
}) {
  const [pgnText, setPgnText] = useState('')
  const [parsedGames, setParsedGames] = useState<ParsedGame[]>([])
  const [selectedGames, setSelectedGames] = useState<Set<number>>(new Set())
  const [error, setError] = useState('')
  const [userColor, setUserColor] = useState<'white' | 'black'>('white')
  const [isDragging, setIsDragging] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePgnChange = (newPgn: string) => {
    setPgnText(newPgn)
    // Only send to Stockfish if it's a single game
    if (!newPgn.includes('[Event ', newPgn.indexOf('[Event ') + 1)) {
      onPgnChange?.(newPgn)
    }
  }

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const pgnFile = files.find(file => file.name.endsWith('.pgn'))

    if (pgnFile) {
      const text = await pgnFile.text()
      handlePgnChange(text)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const text = await file.text()
      handlePgnChange(text)
    }
  }

  // Split multiple PGNs
  const splitPGNs = (text: string): string[] => {
    // Split by double newline followed by [Event or by looking for new game headers
    const games: string[] = []
    const lines = text.split('\n')
    let currentGame = ''
    let inMoves = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (line.startsWith('[Event ') && currentGame && inMoves) {
        // New game started, save the previous one
        games.push(currentGame.trim())
        currentGame = line + '\n'
        inMoves = false
      } else {
        currentGame += line + '\n'
        if (line && !line.startsWith('[') && !line.startsWith('{')) {
          inMoves = true
        }
      }
    }

    if (currentGame.trim()) {
      games.push(currentGame.trim())
    }

    return games.filter(g => g.includes('[') && g.includes('.'))
  }

  const parsePGN = () => {
    if (!pgnText.trim()) {
      setError('Please enter a PGN or drop a file')
      return
    }

    try {
      setError('')
      const pgnGames = splitPGNs(pgnText)
      const parsed: ParsedGame[] = []

      for (const pgn of pgnGames) {
        try {
          const game = parseSinglePGN(pgn)
          if (game) {
            parsed.push(game)
          }
        } catch (err) {
          console.error('Failed to parse game:', err)
        }
      }

      if (parsed.length === 0) {
        setError('No valid games found in PGN')
        return
      }

      setParsedGames(parsed)
      setSelectedGames(new Set(parsed.map((_, i) => i)))
      
      // If single game, send to Stockfish
      if (parsed.length === 1) {
        onPgnChange?.(parsed[0].pgn)
      }

    } catch (err) {
      console.error('PGN parsing error:', err)
      setError('Invalid PGN format. Please check your PGN and try again.')
      setParsedGames([])
    }
  }

  const parseSinglePGN = (pgnText: string): ParsedGame | null => {
    const chess = new Chess()
    chess.loadPgn(pgnText)
    
    // Parse headers
    const headers: Record<string, string> = {}
    const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g
    let match
    
    while ((match = headerRegex.exec(pgnText)) !== null) {
      headers[match[1]] = match[2]
    }

    const white = headers.White || 'Unknown'
    const black = headers.Black || 'Unknown'
    const result = headers.Result || '*'
    const date = headers.Date || new Date().toISOString().split('T')[0]
    const event = headers.Event || ''
    const site = headers.Site || ''
    const timeControl = headers.TimeControl || ''

    const opponent = userColor === 'white' ? black : white

    let userResult: string
    if (result === '1/2-1/2') {
      userResult = 'draw'
    } else if (
      (result === '1-0' && userColor === 'white') ||
      (result === '0-1' && userColor === 'black')
    ) {
      userResult = 'win'
    } else if (
      (result === '0-1' && userColor === 'white') ||
      (result === '1-0' && userColor === 'black')
    ) {
      userResult = 'loss'
    } else {
      userResult = 'draw'
    }

    const opening = detectOpening(chess) || headers.Opening || headers.ECO || 'Unknown Opening'

    let formattedTimeControl = ''
    if (timeControl) {
      formattedTimeControl = timeControl
    } else if (site.toLowerCase().includes('lichess')) {
      formattedTimeControl = 'Lichess'
    } else if (site.toLowerCase().includes('chess.com')) {
      formattedTimeControl = 'Chess.com'
    }

    const notes = [
      event && `Event: ${event}`,
      site && `Site: ${site}`,
      `Players: ${white} vs ${black}`,
      'Imported from PGN'
    ].filter(Boolean).join(' | ')

    return {
      date: formatDate(date),
      opponent,
      result: userResult,
      opening,
      timeControl: formattedTimeControl,
      notes,
      pgn: pgnText.trim(),
      white,
      black,
      event,
      site
    }
  }

  const detectOpening = (chess: Chess): string => {
    const history = chess.history()
    const firstMoves = history.slice(0, 6).join(' ')

    const openings: Record<string, string> = {
      'e4 e5': 'King\'s Pawn Game',
      'e4 e5 Nf3': 'King\'s Knight Opening',
      'e4 e5 Nf3 Nc6': 'Italian Game / Spanish Opening',
      'e4 e5 Nf3 Nc6 Bb5': 'Ruy Lopez',
      'e4 e5 Nf3 Nc6 Bc4': 'Italian Game',
      'e4 c5': 'Sicilian Defense',
      'e4 e6': 'French Defense',
      'e4 c6': 'Caro-Kann Defense',
      'd4 d5': 'Queen\'s Pawn Game',
      'd4 d5 c4': 'Queen\'s Gambit',
      'd4 Nf6': 'Indian Defense',
      'd4 Nf6 c4': 'English Opening',
      'Nf3': 'Réti Opening',
      'c4': 'English Opening',
      'f4': 'Bird\'s Opening',
      'b3': 'Nimzo-Larsen Attack'
    }

    for (const [moves, opening] of Object.entries(openings)) {
      if (firstMoves.startsWith(moves)) {
        return opening
      }
    }

    return 'Unknown Opening'
  }

  const formatDate = (dateStr: string): string => {
    if (dateStr.includes('.')) {
      const parts = dateStr.split('.')
      if (parts.length === 3) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
      }
    }
    return dateStr || new Date().toISOString().split('T')[0]
  }

  const toggleGameSelection = (index: number) => {
    const newSelected = new Set(selectedGames)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedGames(newSelected)
  }

  const importSelectedGames = async () => {
    const gamesToImport = parsedGames.filter((_, i) => selectedGames.has(i))
    if (gamesToImport.length === 0) return

    setIsImporting(true)
    setImportProgress({ current: 0, total: gamesToImport.length })

    let successCount = 0
    for (let i = 0; i < gamesToImport.length; i++) {
      const game = gamesToImport[i]
      try {
        const response = await fetch('/api/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: game.date,
            opponent: game.opponent,
            result: game.result,
            opening: game.opening,
            timeControl: game.timeControl,
            notes: game.notes,
            pgn: game.pgn 
          })
        })

        if (response.ok) {
          successCount++
        }
      } catch (error) {
        console.error('Import error for game:', error)
      }
      
      setImportProgress({ current: i + 1, total: gamesToImport.length })
    }

    setIsImporting(false)
    
    if (successCount > 0) {
      alert(`Successfully imported ${successCount} of ${gamesToImport.length} games!`)
      handlePgnChange('')
      setParsedGames([])
      setSelectedGames(new Set())
      window.location.reload()
    } else {
      alert('Failed to import games. Please try again.')
    }
  }

  const samplePGN = `[Event "Live Chess"]
[Site "Chess.com"]
[Date "2024.12.07"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]
[TimeControl "600"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 1-0`

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-blue-600" />
          Import from PGN
        </h3>
        <button
          onClick={() => handlePgnChange(samplePGN)}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
        >
          <Copy className="h-3 w-3" />
          <span>Use Sample</span>
        </button>
      </div>

      {/* User Color Selection */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">You played as:</label>
        <div className="flex gap-2">
          <button
            onClick={() => setUserColor('white')}
            className={`px-4 py-2 rounded-lg border-2 transition-colors ${
              userColor === 'white'
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            White
          </button>
          <button
            onClick={() => setUserColor('black')}
            className={`px-4 py-2 rounded-lg border-2 transition-colors ${
              userColor === 'black'
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            Black
          </button>
        </div>
      </div>

      {/* Drag and Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mb-4 border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <FileUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 mb-2">
          Drop PGN file here or{' '}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            browse
          </button>
        </p>
        <p className="text-xs text-gray-500">Supports single or multiple games in one file</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pgn"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* PGN Input */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Or paste PGN text:
        </label>
        <textarea
          value={pgnText}
          onChange={(e) => handlePgnChange(e.target.value)}
          placeholder="Paste single or multiple PGN games here..."
          rows={6}
          className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none font-mono text-sm"
        />
      </div>

      {/* Parse Button */}
      <button
        onClick={parsePGN}
        disabled={!pgnText.trim()}
        className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 mb-4"
      >
        <Upload className="h-4 w-4" />
        <span>Parse PGN(s)</span>
      </button>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Parsed Games Display */}
      {parsedGames.length > 0 && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Found {parsedGames.length} game{parsedGames.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedGames(new Set(parsedGames.map((_, i) => i)))}
                  className="text-xs text-green-600 hover:text-green-700"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedGames(new Set())}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
            
            {/* Games List */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {parsedGames.map((game, index) => (
                <div
                  key={index}
                  onClick={() => toggleGameSelection(index)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedGames.has(index)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedGames.has(index)}
                        onChange={() => {}}
                        className="pointer-events-none"
                      />
                      <div className={`w-2 h-2 rounded-full ${
                        game.result === 'win' ? 'bg-green-500' :
                        game.result === 'loss' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <span className="text-sm font-medium">vs {game.opponent}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span>{game.date}</span>
                      <span>{game.opening}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onPgnChange?.(game.pgn)
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Import Progress */}
          {isImporting && (
            <div className="p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">
                  Importing games...
                </span>
                <span className="text-sm text-blue-600">
                  {importProgress.current} / {importProgress.total}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Import Button */}
          <button
            onClick={importSelectedGames}
            disabled={selectedGames.size === 0 || isImporting}
            className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Import {selectedGames.size} Selected Game{selectedGames.size !== 1 ? 's' : ''}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-3 bg-blue-50 rounded-xl">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">New Features:</p>
            <ul className="text-xs space-y-1 text-blue-600">
              <li>• 📁 <strong>Drag & Drop:</strong> Drop PGN files directly</li>
              <li>• 📚 <strong>Bulk Import:</strong> Import multiple games at once</li>
              <li>• 📊 <strong>Progress Bar:</strong> Track import progress</li>
              <li>• 👁️ <strong>Preview:</strong> Click preview to analyze any game</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}