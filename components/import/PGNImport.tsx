'use client'

import { useState } from 'react'
import { FileText, Upload, AlertCircle, CheckCircle, Copy } from 'lucide-react'
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

// Dodana podrška za onPgnChange callback
export default function PGNImport({ 
  onGameParsed,
  onPgnChange 
}: { 
  onGameParsed?: (game: ParsedGame) => void
  onPgnChange?: (pgn: string) => void // NOVO!
}) {
  const [pgnText, setPgnText] = useState('')
  const [parsedGame, setParsedGame] = useState<ParsedGame | null>(null)
  const [error, setError] = useState('')
  const [userColor, setUserColor] = useState<'white' | 'black'>('white')

  // Ažurirani handler koji poziva onPgnChange callback
  const handlePgnChange = (newPgn: string) => {
    setPgnText(newPgn)
    onPgnChange?.(newPgn) // Prosljeđuje PGN za Stockfish analizu
  }

  const parsePGN = () => {
    if (!pgnText.trim()) {
      setError('Please enter a PGN')
      return
    }

    try {
      const chess = new Chess()
      
      // Load PGN
      chess.loadPgn(pgnText)
      
      // Parse headers from PGN
      const headers: Record<string, string> = {}
      const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g
      let match
      
      while ((match = headerRegex.exec(pgnText)) !== null) {
        headers[match[1]] = match[2]
      }

      // Extract game info
      const white = headers.White || 'Unknown'
      const black = headers.Black || 'Unknown'
      const result = headers.Result || '*'
      const date = headers.Date || new Date().toISOString().split('T')[0]
      const event = headers.Event || ''
      const site = headers.Site || ''
      const timeControl = headers.TimeControl || ''

      // Determine opponent based on user color
      const opponent = userColor === 'white' ? black : white

      // Convert result based on user perspective
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
        userResult = 'draw' // Default for incomplete games
      }

      // Get opening name (try to detect from moves)
      const opening = detectOpening(chess) || headers.Opening || 'Unknown Opening'

      // Format time control
      let formattedTimeControl = ''
      if (timeControl) {
        formattedTimeControl = timeControl
      } else if (site.toLowerCase().includes('lichess')) {
        formattedTimeControl = 'Lichess'
      } else if (site.toLowerCase().includes('chess.com')) {
        formattedTimeControl = 'Chess.com'
      }

      // Create notes
      const notes = [
        event && `Event: ${event}`,
        site && `Site: ${site}`,
        `Players: ${white} vs ${black}`,
        'Imported from PGN'
      ].filter(Boolean).join(' | ')

      const parsedGameData: ParsedGame = {
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

      setParsedGame(parsedGameData)
      setError('')

      // Callback to parent if provided
      onGameParsed?.(parsedGameData)

    } catch (err) {
      console.error('PGN parsing error:', err)
      setError('Invalid PGN format. Please check your PGN and try again.')
      setParsedGame(null)
    }
  }

  const detectOpening = (chess: Chess): string => {
    // Simple opening detection based on first few moves
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
      // Convert PGN date format (YYYY.MM.DD) to ISO format
      const parts = dateStr.split('.')
      if (parts.length === 3) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
      }
    }
    return dateStr || new Date().toISOString().split('T')[0]
  }

  const importGame = async () => {
    if (!parsedGame) return

    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: parsedGame.date,
          opponent: parsedGame.opponent,
          result: parsedGame.result,
          opening: parsedGame.opening,
          timeControl: parsedGame.timeControl,
          notes: parsedGame.notes,
          pgn: parsedGame.pgn 
        })
      })

      if (response.ok) {
        alert('Game imported successfully!')
        handlePgnChange('') // Reset PGN
        setParsedGame(null)
        window.location.reload()
      } else {
        throw new Error('Failed to import game')
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('Failed to import game. Please try again.')
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
          onClick={() => handlePgnChange(samplePGN)} // Ažurirano da koristi handlePgnChange
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

      {/* PGN Input */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          PGN Text
        </label>
        <textarea
          value={pgnText}
          onChange={(e) => handlePgnChange(e.target.value)} // Ažurirano da koristi handlePgnChange
          placeholder={`Paste your PGN here...\n\nExample:\n[Event "Live Chess"]\n[Site "Chess.com"]\n[Date "2024.12.07"]\n[White "Player1"]\n[Black "Player2"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5...`}
          rows={8}
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
        <span>Parse PGN</span>
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

      {/* Parsed Game Display */}
      {parsedGame && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">PGN parsed successfully!</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Date:</span>
                <span className="ml-2 text-gray-600">{parsedGame.date}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Opponent:</span>
                <span className="ml-2 text-gray-600">{parsedGame.opponent}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Result:</span>
                <span className={`ml-2 font-medium ${
                  parsedGame.result === 'win' ? 'text-green-600' :
                  parsedGame.result === 'loss' ? 'text-red-600' : 'text-amber-600'
                }`}>
                  {parsedGame.result.charAt(0).toUpperCase() + parsedGame.result.slice(1)}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Opening:</span>
                <span className="ml-2 text-gray-600">{parsedGame.opening}</span>
              </div>
              {parsedGame.timeControl && (
                <div className="col-span-2">
                  <span className="font-medium text-gray-700">Time Control:</span>
                  <span className="ml-2 text-gray-600">{parsedGame.timeControl}</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={importGame}
            className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Import This Game</span>
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-3 bg-blue-50 rounded-xl">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">How to get PGN:</p>
            <ul className="text-xs space-y-1 text-blue-600">
              <li>• <strong>Chess.com:</strong> Go to your game → Copy PGN</li>
              <li>• <strong>Lichess:</strong> Go to your game → Export → PGN</li>
              <li>• <strong>Other sites:</strong> Look for &quot;Export&quot; or &quot;PGN&quot; option</li>
              <li>• Select your color to correctly determine win/loss</li>
              <li>• <strong>NEW:</strong> PGN is now automatically sent for Stockfish analysis! 🏆</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}